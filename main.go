package main

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"path"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

//go:embed static/*
var staticFiles embed.FS

//go:embed config.sample.json
var configSample []byte

// Config holds server configuration loaded from config.json.
type Config struct {
	SMTPHost      string `json:"smtp_host"`
	SMTPPort      int    `json:"smtp_port"`
	SMTPUser      string `json:"smtp_user"`
	SMTPPass      string `json:"smtp_pass"`
	SMTPFrom      string `json:"smtp_from"`
	AdminEmail    string `json:"admin_email"`
	AdminPassword string `json:"admin_password"`
	Port          int    `json:"port"`
}

var (
	cfg              Config
	db               *sql.DB
	jwtKey           = []byte("secret")
	upgrader         = websocket.Upgrader{}
	alarmSubscribers = make(map[*websocket.Conn]bool)
)

func loadConfig() {
	if _, err := os.Stat("config.json"); os.IsNotExist(err) {
		os.WriteFile("config.json", configSample, 0644)
	}
	f, err := os.ReadFile("config.json")
	if err != nil {
		log.Fatal(err)
	}
	if err := json.Unmarshal(f, &cfg); err != nil {
		log.Fatal(err)
	}
	if cfg.Port == 0 {
		cfg.Port = 8090
	}
}

func initDB() {
	var err error
	os.MkdirAll("data", 0755)
	db, err = sql.Open("sqlite3", path.Join("data", "data.db"))
	if err != nil {
		log.Fatal(err)
	}
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password_hash TEXT, role TEXT, receive_notifications BOOLEAN);`,
		`CREATE TABLE IF NOT EXISTS cabinets(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, location TEXT);`,
		`CREATE TABLE IF NOT EXISTS telemetry(id INTEGER PRIMARY KEY AUTOINCREMENT, cabinet_id INTEGER, temperature REAL, humidity REAL, timestamp DATETIME);`,
		`CREATE TABLE IF NOT EXISTS alarm_rules(id INTEGER PRIMARY KEY AUTOINCREMENT, cabinet_id INTEGER, condition_operator TEXT, threshold REAL, created_by INTEGER);`,
		`CREATE TABLE IF NOT EXISTS alarms(id INTEGER PRIMARY KEY AUTOINCREMENT, cabinet_id INTEGER, triggered_at DATETIME, telemetry_id INTEGER, status TEXT, notified BOOLEAN);`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			log.Fatal(err)
		}
	}
	// ensure admin user
	var count int
	db.QueryRow("SELECT COUNT(*) FROM users WHERE role='admin'").Scan(&count)
	if count == 0 {
		pw := hashPassword(cfg.AdminPassword)
		db.Exec("INSERT INTO users(email, password_hash, role, receive_notifications) VALUES(?,?,?,?)", cfg.AdminEmail, pw, "admin", true)
	}
}

func hashPassword(pw string) string {
	// very basic hash for demo purposes
	h := sha256.Sum256([]byte(pw))
	return fmt.Sprintf("%x", h[:])
}

func checkPassword(hash, pw string) bool {
	return hash == hashPassword(pw)
}

func sendMail(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%d", cfg.SMTPHost, cfg.SMTPPort)
	auth := smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPHost)
	msg := []byte("Subject: " + subject + "\r\n" +
		"From: " + cfg.SMTPFrom + "\r\n" +
		"To: " + to + "\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n" +
		body)
	return smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{to}, msg)
}

func createToken(userID int, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	return token.SignedString(jwtKey)
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) { return jwtKey, nil })
		if err != nil || !token.Valid {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		claims := token.Claims.(jwt.MapClaims)
		ctx := context.WithValue(r.Context(), "user_id", int(claims["user_id"].(float64)))
		ctx = context.WithValue(ctx, "role", claims["role"].(string))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func roleRequired(role string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Context().Value("role") != role {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next(w, r)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	json.NewDecoder(r.Body).Decode(&creds)
	var id int
	var pwHash, role string
	err := db.QueryRow("SELECT id, password_hash, role FROM users WHERE email=?", creds.Email).Scan(&id, &pwHash, &role)
	if err != nil || !checkPassword(pwHash, creds.Password) {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	token, _ := createToken(id, role)
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

// CRUD handlers for cabinets, telemetry, alarm rules, users simplified
func getCabinets(w http.ResponseWriter, r *http.Request) {
	rows, _ := db.Query("SELECT id, name, location FROM cabinets")
	defer rows.Close()
	var cabs []map[string]interface{}
	for rows.Next() {
		var id int
		var name, loc string
		rows.Scan(&id, &name, &loc)
		cabs = append(cabs, map[string]interface{}{"id": id, "name": name, "location": loc})
	}
	json.NewEncoder(w).Encode(cabs)
}

func addTelemetry(w http.ResponseWriter, r *http.Request) {
	var t struct {
		CabinetID   int     `json:"cabinet_id"`
		Temperature float64 `json:"temperature"`
		Humidity    float64 `json:"humidity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	res, err := db.Exec("INSERT INTO telemetry(cabinet_id, temperature, humidity, timestamp) VALUES(?,?,?,?)", t.CabinetID, t.Temperature, t.Humidity, time.Now())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tid, _ := res.LastInsertId()
	checkRules(int(tid), t.CabinetID, t.Temperature)
	w.WriteHeader(http.StatusCreated)
}

func checkRules(telemetryID int, cabinetID int, temperature float64) {
	rows, err := db.Query("SELECT id, condition_operator, threshold FROM alarm_rules WHERE cabinet_id=?", cabinetID)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var op string
		var th float64
		rows.Scan(&id, &op, &th)
		trigger := false
		switch op {
		case ">":
			trigger = temperature > th
		case "<":
			trigger = temperature < th
		case ">=":
			trigger = temperature >= th
		case "<=":
			trigger = temperature <= th
		}
		if trigger {
			res, _ := db.Exec("INSERT INTO alarms(cabinet_id, triggered_at, telemetry_id, status, notified) VALUES(?,?,?,?,0)", cabinetID, time.Now(), telemetryID, "new")
			alarmID, _ := res.LastInsertId()
			notifyUsers(int(alarmID), cabinetID, temperature, th)
		}
	}
}

func notifyUsers(alarmID int, cabinetID int, temp, threshold float64) {
	rows, err := db.Query("SELECT email FROM users WHERE receive_notifications=1")
	if err != nil {
		return
	}
	defer rows.Close()
	var cabinetName string
	db.QueryRow("SELECT name FROM cabinets WHERE id=?", cabinetID).Scan(&cabinetName)
	subject := fmt.Sprintf("🔥 Alarm: %s sıcaklık eşiğini aştı", cabinetName)
	body := fmt.Sprintf("Kabinet: %s\nÖlçüm: %.2f\nEşik: %.2f\nSaat: %s", cabinetName, temp, threshold, time.Now().Format(time.RFC3339))
	for rows.Next() {
		var email string
		rows.Scan(&email)
		if err := sendMail(email, subject, body); err == nil {
			db.Exec("UPDATE alarms SET notified=1 WHERE id=?", alarmID)
		}
	}
	// broadcast via websocket
	for c := range alarmSubscribers {
		c.WriteJSON(map[string]interface{}{"cabinet": cabinetName, "temperature": temp, "threshold": threshold})
	}
}

func alarmsWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	alarmSubscribers[conn] = true
	for {
		if _, _, err := conn.NextReader(); err != nil {
			conn.Close()
			delete(alarmSubscribers, conn)
			break
		}
	}
}

func main() {
	loadConfig()
	initDB()

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		// serve embedded static index.html
		index, _ := staticFiles.ReadFile("static/index.html")
		w.Write(index)
	})

	r.Post("/auth/login", loginHandler)

	api := chi.NewRouter()
	api.Use(authMiddleware)
	api.Get("/cabinets", getCabinets)
	api.Post("/telemetry", addTelemetry)
	r.Mount("/api", api)
	r.Get("/ws/alarms", alarmsWS)

	// serve other static files
	fsys, _ := fs.Sub(staticFiles, "static")
	r.Handle("/*", http.FileServer(http.FS(fsys)))

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Println("listening on", addr)
	http.ListenAndServe(addr, r)
}
