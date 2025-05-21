# Ariot – AFDX-lite-IoT Protocol Stack

**Ariot** is an open-source communication protocol for low-power IoT networks, inspired by avionics-grade AFDX (ARINC-664). It brings deterministic, real-time, prioritized messaging to devices like ESP32 and Raspberry Pi using WiFi or LoRa.

> Developed by **Rifat Şeker**  
> Founder of **Ariot Teknoloji** – Industrial IoT, Automation & AI  

---

## ⚙️ Features

- ⏱️ TDMA-style deterministic time slot communication
- 🔁 Real-time SYNC broadcast from gateway
- 🅰️🅱️🅲️ Message prioritization (Class A: Critical, B: Operational, C: Background)
- 🚨 Out-of-band emergency alerts (ALERT packets)
- ⚡ Ultra-low latency (sub-10ms for Class A messages)
- 📡 Compatible with **ESP32 DevKit V1** and **Raspberry Pi 5**
- 🛜 Runs over **LoRa (SX127x)** or **WiFi (ESP-NOW)**

---

## 📁 Folder Structure

