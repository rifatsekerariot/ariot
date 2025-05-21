# Ariot – AFDX-lite-IoT Protocol Stack

**Ariot** is an open-source communication protocol stack for ultra-reliable, low-power IoT networks.  
Inspired by avionics-grade AFDX (ARINC-664), it brings **deterministic**, **time-slotted**, and **priority-based** messaging to devices like ESP32 and Raspberry Pi.

Designed for industrial use cases such as AGVs, smart grids, and safety-critical sensor networks.

---

### 🧠 Developed by  
**Rifat Şeker**  
Founder of Ariot Teknoloji – Industrial IoT, Automation & AI  
🇹🇷 Made with passion in Adana, Türkiye

---

## ⚙️ Key Features

- ⏱️ **Deterministic TDMA-style communication** (10ms slots)
- 🔁 **Real-time SYNC broadcasting** from gateway (every 1s)
- 🅰️🅱️🅲️ **Message prioritization**  
  - Class A: Critical alerts  
  - Class B: Telemetry / Ops  
  - Class C: Background logs
- 🚨 **Out-of-band ALERT packets** bypass time slot for emergencies
- ⚡ **Sub-10ms latency** for critical messages
- 📡 Works with **ESP32 DevKit V1** & **Raspberry Pi 5**
- 🛜 Supports **LoRa (SX1276)** and **WiFi (ESP-NOW)** backhaul

---

## 📦 Project Structure

```bash
/src
  ├── afdx_client.ino        # ESP32 firmware (Arduino)
  ├── slot_scheduler.py      # Gateway scheduler (Python)
  └── packet_receiver.py     # Gateway data listener

/docs
  └── RFC_v0.2.md            # Protocol specification (Markdown)

