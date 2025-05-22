# ESP32-A ALERT Test Log – Overheat Scenario

📅 **Date:** 2025-05-21  
👤 **Tester:** Rifat Şeker  
🔧 **Device:** ESP32 DevKit V1  
🌐 **Network:** WiFi with TDMA (10ms slot), Gateway IP: `192.168.1.11`  
🎯 **Scenario:** Device temperature exceeded 29.8°C, triggering an emergency `ALERT` packet.

---

### 🔹 Raw Output

[RECV] 1747901434.310 | 192.168.1.6 | {"type":"DATA","device":"ESP32-A","temp":29.79999}
[ALERT] 1747901434.322 | 192.168.1.6 | {"type":"ALERT","device":"ESP32-A","message":"Overheat detected!"}
[RECV] 1747901435.179 | 192.168.1.11 | {"type": "SYNC", "timestamp": 1747901435.1791446, "slots": {"0": {"device_id": "ESP32-A", "priority": "B", "duration_ms": 10}, "1": {"device_id": "ESP32-B", "priority": "C", "duration_ms": 10}}}


---

### 📊 Analysis

| Component        | Status | Description |
|------------------|--------|-------------|
| **SYNC**         | ✅     | The gateway sends synchronization every 1 second. |
| **DATA**         | ✅     | Temperature data is sent correctly. |
| **ALERT**        | ✅     | Emergency message is triggered immediately after overheat detection. |
| **Latency**      | ✅     | Delay between DATA and ALERT is ~12ms. |

---

### ✅ Result

- AFDX-lite-IoT protocol’s out-of-band `ALERT` mechanism works as expected.
- System achieved ultra-low latency suitable for real-time safety applications.


