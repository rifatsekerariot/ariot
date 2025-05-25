#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>

const char* ssid = "wifi";
const char* password = "pass";
const char* gatewayIP = "192.168.1.11";
const int udpPort = 5005;

WiFiUDP udp;

struct DeviceConfig {
  int slotId = 0;
  int slotDurationMs = 10;
  const char* deviceName = "ESP32-A";
};

struct SensorData {
  float temperature = 23.0;
  float tempIncrement = 0.4;
  float alertThreshold = 29.8;
  bool alertSent = false;
};

struct TimeSync {
  unsigned long lastSyncTime = 0;
  long localOffsetMs = 0;
  const unsigned long syncTimeoutMs = 30000;
};

DeviceConfig config;
SensorData sensor;
TimeSync timeSync;

unsigned long getSyncedTimeMs() {
  return millis() + timeSync.localOffsetMs;
}

bool isSyncValid() {
  return (millis() - timeSync.lastSyncTime) < timeSync.syncTimeoutMs;
}

void connectToWiFi() {
  Serial.print("WiFi baglantisi kuruluyor");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 50) {
    delay(200);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi baglantisi basarili!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi baglantisi basarisiz!");
  }
}

void handleSyncMessage() {
  int packetSize = udp.parsePacket();
  if (packetSize > 0) {
    char buffer[512];
    int len = udp.read(buffer, sizeof(buffer) - 1);
    buffer[len] = '\0';
    
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, buffer);
    
    if (!error && doc["type"] == "SYNC") {
      double timestamp = doc["timestamp"];
      timeSync.localOffsetMs = (long)(timestamp * 1000) - (long)millis();
      timeSync.lastSyncTime = millis();
      Serial.println("Zaman senkronizasyonu tamamlandi");
    }
  }
}

bool sendUDPMessage(const char* jsonData) {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  udp.beginPacket(gatewayIP, udpPort);
  size_t written = udp.write((const uint8_t*)jsonData, strlen(jsonData));
  bool success = udp.endPacket();
  
  if (success) {
    Serial.println(jsonData);
  }
  return success;
}

void sendSensorData() {
  StaticJsonDocument<256> doc;
  doc["type"] = "DATA";
  doc["device"] = config.deviceName;
  doc["temp"] = sensor.temperature;
  doc["timestamp"] = getSyncedTimeMs();
  
  char buffer[256];
  serializeJson(doc, buffer);
  sendUDPMessage(buffer);
}

void sendAlert(const String& message) {
  StaticJsonDocument<256> doc;
  doc["type"] = "ALERT";
  doc["device"] = config.deviceName;
  doc["message"] = message;
  doc["timestamp"] = getSyncedTimeMs();
  doc["temp"] = sensor.temperature;
  
  char buffer[256];
  serializeJson(doc, buffer);
  sendUDPMessage(buffer);
}

void updateSensorData() {
  sensor.temperature += sensor.tempIncrement;
  
  if (sensor.temperature > sensor.alertThreshold && !sensor.alertSent) {
    sendAlert("Asiri isinma tespit edildi!");
    sensor.alertSent = true;
  }
  
  if (sensor.temperature > 35.0) {
    sensor.temperature = 23.0;
    sensor.alertSent = false;
  }
}

bool isMyTimeSlot() {
  if (!isSyncValid()) return false;
  
  unsigned long currentTime = getSyncedTimeMs();
  int cyclePosition = currentTime % 1000;
  int slotStart = config.slotId * config.slotDurationMs;
  int slotEnd = (config.slotId + 1) * config.slotDurationMs;
  
  return (cyclePosition >= slotStart && cyclePosition < slotEnd);
}

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 IoT Sensor baslatiliyor...");
  
  connectToWiFi();
  udp.begin(udpPort);
  
  Serial.println("UDP dinleme baslatildi");
  Serial.print("Slot ID: ");
  Serial.println(config.slotId);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi baglantisi koptu, yeniden baglaniliyor...");
    connectToWiFi();
    return;
  }
  
  handleSyncMessage();
  
  if (isMyTimeSlot()) {
    updateSensorData();
    sendSensorData();
    delay(config.slotDurationMs);
  }
  
  delay(1);
}
