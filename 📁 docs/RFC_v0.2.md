# RFC: AFDX-lite-IoT Protocol Specification (v0.2)

**Title**: AFDX-lite-IoT: Deterministic and Prioritized Communication Protocol for Low-Power IoT Networks  
**Author**: Rifat Şeker – Ariot Teknoloji  
**Status**: Draft (v0.2)  
**Date**: 2025-05-21  

---

## 1. Introduction

AFDX-lite-IoT is a lightweight, deterministic communication protocol designed for time-sensitive IoT networks. Inspired by the Avionics Full Duplex Switched Ethernet (AFDX) protocol used in aircraft systems, this protocol adapts its principles for low-power, low-bandwidth IoT deployments. It ensures guaranteed delivery timing, bandwidth allocation, and message prioritization across constrained wireless environments such as LoRa and WiFi.

---

## 2. Motivation

Current IoT protocols (MQTT, CoAP) lack hard timing guarantees and are unsuitable for critical real-time applications such as AGVs, remote safety controls, and grid monitoring. AFDX-lite-IoT introduces deterministic, time-slot-based scheduling for such scenarios, with sub-10ms latency capability.

---

## 3. Core Concepts

### 3.1 TDMA-like Time Slot Scheduling

- The communication window is divided into 1-second frames, each subdivided into 10ms slots.
- Each device is assigned a fixed slot for transmission.
- A SYNC broadcast every 1000ms maintains network-wide time alignment.

### 3.2 Prioritized Messaging

Messages are divided into three classes:

- **Class A**: Critical – emergency alerts, shutdown commands
- **Class B**: Operational – periodic telemetry, sensor data
- **Class C**: Background – logs, diagnostics

The gateway processes messages in order of priority within and outside slots.

### 3.3 Bandwidth Allocation

Each device is guaranteed a minimum bandwidth allocation via fixed slot duration and frequency. Devices may voluntarily skip slots to save energy.

---

## 4. Packet Format

```plaintext
+----------------------+----------------------+----------------------+
| Header (2B)          | Timestamp (4B)       | Priority (1B)        |
+----------------------+----------------------+----------------------+
| Device ID (2B)       | Payload Length (1B)  | Payload (1–128B)     |
+----------------------+----------------------+----------------------+
```

- **Header**: Protocol version and slot ID  
- **Timestamp**: Local device time (for sync drift)  
- **Priority**: A / B / C  
- **Device ID**: 16-bit unique ID  
- **Payload**: Encoded application data

---

## 5. Synchronization Mechanism

- Gateway sends SYNC broadcast every 1000ms over UDP
- ESP32 clients update their local time using `local_offset = timestamp – millis()`
- Optional fine tuning with NTP or GPS (future scope)

---

## 6. Protocol Operations

| Operation | Description |
|----------|-------------|
| `JOIN`   | Device requests participation and receives a slot |
| `SYNC`   | Broadcasted by gateway to align time |
| `DATA`   | Sent by device during assigned slot |
| `ALERT`  | Emergency data, can bypass slot scheduling |
| `LEAVE`  | Graceful disconnection and slot release |

---

## 7. Use Cases

- Autonomous guided vehicles (AGVs)
- Energy grid real-time controllers
- Industrial actuator feedback loops
- Remote alarm and emergency response

---

## 8. Implementation Notes

- Tested with: ESP32 DevKit V1 and Raspberry Pi 5
- Communication: LoRa (SX1276) and ESP-NOW (WiFi)
- Gateway logic written in Python 3.11
- Client firmware in Arduino C++

---

## 9. Security Considerations

- AES-128 encryption of payload (optional)
- Message authentication code (MAC) for Class A packets
- Timestamp + nonce for replay protection

---

## 10. Future Work

- Dynamic slot allocation and reallocation
- Token-based slot sharing
- Blockchain-based audit log
- Group (multicast) slot messaging

---

**End of RFC v0.2**
