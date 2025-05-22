#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>

const int udpPort = 5005;
WiFiUDP udp;
unsigned long lastSyncTime = 0;
unsigned long localOffsetMs = 0;

const char* ssid = "wifi";
const char* password = "pass";

int mySlotId = 0; // ESP32-A için 0, ESP32-B için 1
int slotDurationMs = 10;
float fakeTemp = 23.0;
bool alertSent = false;

unsigned long getSyncedTimeMs() {
  return millis() + localOffsetMs;
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(200);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Bağlantı sağlandı!");
}

void listenForSync() {
  int packetSize = udp.parsePacket();
  if (packetSize > 0) {
    char buffer[512];
    udp.read(buffer, 512);
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, buffer);
    if (!error && doc["type"] == "SYNC") {
      double timestamp = doc["timestamp"];
      localOffsetMs = (unsigned long)(timestamp * 1000) - millis();
      lastSyncTime = millis();
      Serial.println("[SYNC] Senkronizasyon tamam.");
    }
  }
}

void sendData() {
  StaticJsonDocument<256> doc;
  doc["type"] = "DATA";
  doc["device"] = "ESP32-A";
  doc["temp"] = fakeTemp;

  char buffer[256];
  serializeJson(doc, buffer);
  udp.beginPacket("192.168.1.11", udpPort); // Gateway IP
  udp.write((uint8_t*)buffer, strlen(buffer));
  udp.endPacket();
  Serial.print("[DATA] Gönderildi: ");
  Serial.println(buffer);
}

void sendAlert(const String& msg) {
  StaticJsonDocument<256> doc;
  doc["type"] = "ALERT";
  doc["device"] = "ESP32-A";
  doc["message"] = msg;

  char buffer[256];
  serializeJson(doc, buffer);
  udp.beginPacket("192.168.1.11", udpPort);
  udp.write((uint8_t*)buffer, strlen(buffer));
  udp.endPacket();
  Serial.print("[ALERT] Gönderildi: ");
  Serial.println(buffer);
}

void setup() {
  Serial.begin(115200);
  connectToWiFi();
  udp.begin(udpPort);
}

void loop() {
  listenForSync();

  unsigned long currentTime = getSyncedTimeMs();
  int cycleTime = (currentTime % 1000);

  if (cycleTime >= mySlotId * slotDurationMs && cycleTime < (mySlotId + 1) * slotDurationMs) {
    fakeTemp += 0.4;
    sendData();

    if (fakeTemp > 29.8 && !alertSent) {
      sendAlert("Overheat detected!");
      alertSent = true;
    }

    delay(slotDurationMs);
  }
}
