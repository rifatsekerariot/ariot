#include <WiFi.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>

const int udpPort = 5005;
WiFiUDP udp;
unsigned long lastSyncTime = 0;
unsigned long localOffsetMs = 0;

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

int mySlotId = 0; // ESP32-A için 0, ESP32-B için 1
int slotDurationMs = 10;
unsigned long slotStartMs = 0;

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
  Serial.println("\n[WiFi] Bağlandı.");
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
      Serial.println("[SYNC] Saat senkronize edildi.");
    }
  }
}

void sendData() {
  WiFiUDP sender;
  sender.beginPacket("192.168.1.100", udpPort); // Gateway IP
  sender.print("DATA|ESP32-A|Temp:" + String(fakeTemp));
  sender.endPacket();
  Serial.println("[DATA] Gönderildi.");
}

void sendAlert(String alertData) {
  WiFiUDP sender;
  sender.beginPacket("192.168.1.100", udpPort);
  sender.print(alertData);
  sender.endPacket();
  Serial.println("[ALERT] Kritik veri gönderildi!");
}

void setup() {
  Serial.begin(115200);
  connectToWiFi();
  udp.begin(udpPort);
}

void loop() {
  listenForSync();

  unsigned long
