# Ariot – AFDX-lite-IoT Protocol Stack

**Ariot** is an open-source communication protocol stack for ultra-reliable, low-power IoT networks.  
Inspired by avionics-grade AFDX (ARINC-664), it brings **deterministic**, **time-slotted**, and **priority-based** messaging to devices like ESP32 and Raspberry Pi.

Designed for industrial use cases such as AGVs, smart grids, and safety-critical sensor networks.

---

### 👨‍💻 Developed by  
**Rifat Şeker**  
Founder of **Ariot Teknoloji**  
🔧 Industrial IoT • Automation • Embedded AI  
📍 Adana, Türkiye

---

## ⚙️ Key Features

- ⏱️ **TDMA-style deterministic communication** with 10ms slots
- 🔁 **Real-time SYNC broadcast** from gateway every 1 second
- 🅰️🅱️🅲️ **Priority-based messaging**  
  - Class A → Critical (emergencies)  
  - Class B → Operational (telemetry)  
  - Class C → Background (logs, status)
- 🚨 **Out-of-band ALERT packets** for emergency bypass
- ⚡ **Ultra-low latency** (sub-10ms delivery for Class A)
- 📡 Compatible with **ESP32 DevKit V1** and **Raspberry Pi 5**
- 🛜 Supports both **LoRa (SX127x)** and **WiFi (ESP-NOW)**

---

## 📦 Project Structure

```bash
/src
  ├── afdx_client.ino        # ESP32 firmware (Arduino-based)
  ├── slot_scheduler.py      # Python-based slot time scheduler (Gateway)
  └── packet_receiver.py     # UDP-based data collector (Gateway)

/docs
  └── RFC_v0.2.md            # Protocol specification (Markdown format)

---

📌 Known issue: Rust toolchain may conflict with Arduino IDE 3.1.2 on Windows. See https://github.com/rifatsekerariot/ariot/issues/1#issue-3082451242

## 📑 Test Logs

The protocol stack has been tested under various real-world scenarios.

- 🔥 **[ESP32-A ALERT – Overheat Scenario](docs/test-logs/esp32-a_alert_test.md)**  
  Demonstrates emergency `ALERT` packet triggering when temperature crosses 29.8°C threshold.
---
