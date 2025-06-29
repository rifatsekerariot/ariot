#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>
#include <mbedtls/aes.h>
#include <esp_system.h>
#include <esp_wifi.h>

// Configuration
struct DeviceConfig {
  const char* deviceId = "ESP32-001";
  const char* ssid = "AFDX_Network";
  const char* password = "afdx_secure_2024";
  const char* gatewayIP = "192.168.1.100";
  int udpPort = 5005;
  int priority = 1; // 0=Critical, 1=High, 2=Normal, 3=Low
  int bandwidth = 1000; // bps
};

struct NetworkState {
  WiFiUDP udp;
  unsigned long lastSyncTime = 0;
  long localOffsetMs = 0;
  int slotId = -1;
  bool isRegistered = false;
  unsigned long lastHeartbeat = 0;
  int sequenceNumber = 0;
};

struct SensorData {
  float temperature = 23.0;
  float humidity = 45.0;
  float pressure = 1013.25;
  int batteryLevel = 100;
  bool alertCondition = false;
};

struct SecurityContext {
  uint8_t deviceKey[32];
  uint8_t sessionKey[32];
  char sessionId[33];
  bool isAuthenticated = false;
  unsigned long keyExpiry = 0;
};

// Global instances
DeviceConfig config;
NetworkState network;
SensorData sensors;
SecurityContext security;

// Timing constants
const unsigned long SYNC_TIMEOUT = 30000;
const unsigned long HEARTBEAT_INTERVAL = 10000;
const unsigned long REGISTRATION_TIMEOUT = 30000;
const unsigned long SENSOR_UPDATE_INTERVAL = 1000;

// Function declarations
void connectToWiFi();
void registerWithGateway();
void handleSyncMessage();
void sendHeartbeat();
void updateSensors();
void sendSensorData();
void sendAlert(const String& message, const String& severity = "HIGH");
bool isMyTimeSlot();
unsigned long getSyncedTime();
void encryptMessage(const char* plaintext, char* ciphertext);
void generateMAC(const char* message, char* mac);
bool validateMessage(const char* message, const char* mac);

void setup() {
  Serial.begin(115200);
  Serial.println("AFDX-lite-IoT ESP32 Client v2.0");
  Serial.println("Initializing...");
  
  // Initialize random seed
  randomSeed(esp_random());
  
  // Generate device key
  for (int i = 0; i < 32; i++) {
    security.deviceKey[i] = random(256);
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize UDP
  network.udp.begin(config.udpPort);
  
  // Register with gateway
  registerWithGateway();
  
  Serial.println("Initialization complete");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectToWiFi();
    return;
  }
  
  // Handle incoming messages
  handleSyncMessage();
  
  // Send heartbeat if needed
  if (millis() - network.lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    network.lastHeartbeat = millis();
  }
  
  // Update sensors
  updateSensors();
  
  // Send data in assigned time slot
  if (network.isRegistered && isMyTimeSlot()) {
    sendSensorData();
    delay(10); // Slot duration
  }
  
  // Check for alert conditions
  if (sensors.alertCondition && !sensors.alertCondition) {
    sendAlert("Critical sensor threshold exceeded!");
    sensors.alertCondition = true;
  }
  
  delay(1);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(config.ssid);
  
  WiFi.begin(config.ssid, config.password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 50) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected! IP: ");
    Serial.println(WiFi.localIP());
    
    // Set WiFi power mode for better performance
    esp_wifi_set_ps(WIFI_PS_NONE);
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
    delay(5000);
    ESP.restart();
  }
}

void registerWithGateway() {
  Serial.println("Registering with gateway...");
  
  StaticJsonDocument<512> doc;
  doc["type"] = "JOIN";
  doc["deviceId"] = config.deviceId;
  doc["priority"] = config.priority;
  doc["bandwidth"] = config.bandwidth;
  doc["timestamp"] = millis();
  doc["sequence"] = network.sequenceNumber++;
  
  // Add device capabilities
  JsonObject capabilities = doc.createNestedObject("capabilities");
  capabilities["sensors"] = true;
  capabilities["encryption"] = true;
  capabilities["compression"] = false;
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  // Send registration request
  network.udp.beginPacket(config.gatewayIP, config.udpPort);
  network.udp.write((uint8_t*)buffer, strlen(buffer));
  network.udp.endPacket();
  
  Serial.println("Registration request sent");
  
  // Wait for response
  unsigned long startTime = millis();
  while (millis() - startTime < REGISTRATION_TIMEOUT) {
    int packetSize = network.udp.parsePacket();
    if (packetSize > 0) {
      char responseBuffer[512];
      int len = network.udp.read(responseBuffer, sizeof(responseBuffer) - 1);
      responseBuffer[len] = '\0';
      
      StaticJsonDocument<512> response;
      DeserializationError error = deserializeJson(response, responseBuffer);
      
      if (!error && response["type"] == "ACK") {
        String status = response["status"];
        if (status == "ACCEPTED") {
          network.slotId = response["slotId"];
          network.isRegistered = true;
          
          // Extract session key if provided
          if (response.containsKey("sessionKey")) {
            String sessionKey = response["sessionKey"];
            // Decrypt session key with device key
            // Implementation depends on encryption method
          }
          
          Serial.print("Registration successful! Assigned slot: ");
          Serial.println(network.slotId);
          return;
        } else {
          Serial.print("Registration rejected: ");
          Serial.println(response["reason"].as<String>());
        }
      }
    }
    delay(100);
  }
  
  Serial.println("Registration timeout, retrying...");
  delay(5000);
  registerWithGateway();
}

void handleSyncMessage() {
  int packetSize = network.udp.parsePacket();
  if (packetSize > 0) {
    char buffer[1024];
    int len = network.udp.read(buffer, sizeof(buffer) - 1);
    buffer[len] = '\0';
    
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, buffer);
    
    if (!error && doc["type"] == "SYNC") {
      double timestamp = doc["timestamp"];
      network.localOffsetMs = (long)(timestamp) - (long)millis();
      network.lastSyncTime = millis();
      
      // Update slot information if provided
      if (doc.containsKey("slots")) {
        JsonObject slots = doc["slots"];
        if (slots.containsKey(String(network.slotId))) {
          JsonObject mySlot = slots[String(network.slotId)];
          // Update slot parameters if needed
        }
      }
      
      Serial.println("Sync received and processed");
    }
  }
}

void sendHeartbeat() {
  if (!network.isRegistered) return;
  
  StaticJsonDocument<256> doc;
  doc["type"] = "HEARTBEAT";
  doc["deviceId"] = config.deviceId;
  doc["timestamp"] = getSyncedTime();
  doc["sequence"] = network.sequenceNumber++;
  doc["status"] = "ONLINE";
  doc["batteryLevel"] = sensors.batteryLevel;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  network.udp.beginPacket(config.gatewayIP, config.udpPort);
  network.udp.write((uint8_t*)buffer, strlen(buffer));
  network.udp.endPacket();
}

void updateSensors() {
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate < SENSOR_UPDATE_INTERVAL) return;
  
  // Simulate sensor readings
  sensors.temperature += (random(-10, 11) / 100.0);
  sensors.humidity += (random(-5, 6) / 10.0);
  sensors.pressure += (random(-50, 51) / 100.0);
  
  // Constrain values to realistic ranges
  sensors.temperature = constrain(sensors.temperature, -40, 85);
  sensors.humidity = constrain(sensors.humidity, 0, 100);
  sensors.pressure = constrain(sensors.pressure, 800, 1200);
  
  // Check for alert conditions
  if (sensors.temperature > 60 || sensors.temperature < -20) {
    sensors.alertCondition = true;
  } else {
    sensors.alertCondition = false;
  }
  
  // Simulate battery drain
  if (random(1000) == 0) {
    sensors.batteryLevel = max(0, sensors.batteryLevel - 1);
  }
  
  lastUpdate = millis();
}

void sendSensorData() {
  StaticJsonDocument<512> doc;
  doc["type"] = "DATA";
  doc["deviceId"] = config.deviceId;
  doc["timestamp"] = getSyncedTime();
  doc["sequence"] = network.sequenceNumber++;
  doc["priority"] = config.priority;
  
  // Sensor data
  JsonObject data = doc.createNestedObject("data");
  data["temperature"] = round(sensors.temperature * 100) / 100.0;
  data["humidity"] = round(sensors.humidity * 10) / 10.0;
  data["pressure"] = round(sensors.pressure * 100) / 100.0;
  data["battery"] = sensors.batteryLevel;
  
  // System info
  JsonObject system = doc.createNestedObject("system");
  system["freeHeap"] = ESP.getFreeHeap();
  system["uptime"] = millis();
  system["rssi"] = WiFi.RSSI();
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  network.udp.beginPacket(config.gatewayIP, config.udpPort);
  network.udp.write((uint8_t*)buffer, strlen(buffer));
  network.udp.endPacket();
  
  Serial.print("Data sent - Temp: ");
  Serial.print(sensors.temperature);
  Serial.print("°C, Humidity: ");
  Serial.print(sensors.humidity);
  Serial.println("%");
}

void sendAlert(const String& message, const String& severity) {
  StaticJsonDocument<512> doc;
  doc["type"] = "ALERT";
  doc["deviceId"] = config.deviceId;
  doc["timestamp"] = getSyncedTime();
  doc["sequence"] = network.sequenceNumber++;
  doc["severity"] = severity;
  doc["message"] = message;
  
  // Include current sensor data
  JsonObject data = doc.createNestedObject("data");
  data["temperature"] = sensors.temperature;
  data["humidity"] = sensors.humidity;
  data["pressure"] = sensors.pressure;
  data["battery"] = sensors.batteryLevel;
  
  char buffer[512];
  serializeJson(doc, buffer);
  
  // Send alert immediately (bypass slot timing)
  network.udp.beginPacket(config.gatewayIP, config.udpPort);
  network.udp.write((uint8_t*)buffer, strlen(buffer));
  network.udp.endPacket();
  
  Serial.print("ALERT sent: ");
  Serial.println(message);
}

bool isMyTimeSlot() {
  if (!network.isRegistered || network.slotId < 0) return false;
  
  // Check if sync is still valid
  if (millis() - network.lastSyncTime > SYNC_TIMEOUT) {
    Serial.println("Sync timeout - waiting for new sync");
    return false;
  }
  
  unsigned long currentTime = getSyncedTime();
  int cyclePosition = currentTime % 1000; // 1 second cycle
  int slotStart = network.slotId * 10; // 10ms slots
  int slotEnd = (network.slotId + 1) * 10;
  
  return (cyclePosition >= slotStart && cyclePosition < slotEnd);
}

unsigned long getSyncedTime() {
  return millis() + network.localOffsetMs;
}

void encryptMessage(const char* plaintext, char* ciphertext) {
  // Placeholder for AES encryption
  // Implementation would use mbedtls library
  strcpy(ciphertext, plaintext);
}

void generateMAC(const char* message, char* mac) {
  // Placeholder for HMAC generation
  // Implementation would use mbedtls library
  strcpy(mac, "dummy_mac");
}

bool validateMessage(const char* message, const char* mac) {
  // Placeholder for MAC validation
  // Implementation would use mbedtls library
  return true;
}