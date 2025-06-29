# AFDX-lite-IoT Protocol Stack v1.0

**AFDX-lite-IoT** is a lightweight, deterministic communication protocol for time-sensitive IoT networks. Inspired by avionics AFDX (ARINC-664), it brings **TDMA scheduling** and **priority-based messaging** to industrial IoT applications.

## 🎯 Current Status (v1.0)

### ✅ **Implemented Features**
- **🕐 TDMA Scheduling**: 1-second frames with 10ms slots
- **📊 Real-time Dashboard**: React-based web interface
- **🔌 ESP32 Integration**: Tested with 2-5 devices
- **📡 UDP Communication**: Reliable local network messaging
- **🗄️ SQLite Database**: Message logging and device management
- **⚡ WebSocket Updates**: Live monitoring and alerts
- **🔒 Basic Security**: AES encryption support

### 🚧 **In Development**
- **Advanced TDMA**: Dynamic slot allocation
- **Enhanced Security**: Military-grade encryption
- **AGV Coordination**: Real-time collision avoidance
- **Performance Optimization**: Sub-10ms latency target

### 📊 **Current Performance**
- **Latency**: 15-50ms average (target: <10ms)
- **Reliability**: 99.5% packet delivery (target: 99.9%)
- **Devices**: Tested with 2-5 ESP32s (target: 100+)
- **Network**: Local WiFi/Ethernet (expanding to LoRa)

---

## 👨‍💻 Developed by  
**Rifat Şeker**  
Founder of **Ariot Teknoloji**  
🔧 Industrial IoT • Automation • Embedded Systems  
📍 Adana, Türkiye

---

## ⚙️ Core Features

### 🕐 Time Division Multiple Access (TDMA)
- **Fixed Time Slots**: 10ms slots in 1-second frames
- **Deterministic Access**: Guaranteed transmission windows
- **Collision-Free**: No packet collisions in assigned slots
- **Synchronization**: UDP broadcast sync every 1000ms

### 🎯 Priority-Based Messaging
- **3-Level Priority**: A (Critical), B (Operational), C (Background)
- **Emergency Bypass**: Out-of-band alerts for critical conditions
- **Queue Management**: Priority-based message queuing
- **QoS Support**: Service level differentiation

### 🌐 Multi-Transport Support
- **WiFi (ESP-NOW)**: Primary communication method
- **UDP/IP**: Standard network protocol
- **Serial**: Debug and configuration interface
- **Future**: LoRa, Ethernet, Cellular

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Dashboard                            │
│              (React + Socket.IO)                           │
├─────────────────────────────────────────────────────────────┤
│                    REST API                                 │
│              (Express + WebSocket)                          │
├─────────────────────────────────────────────────────────────┤
│                  Gateway Core                               │
│    ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│    │   TDMA      │  Protocol   │ Monitoring  │  Database   │ │
│    │ Scheduler   │  Handler    │   System    │  Manager    │ │
│    └─────────────┴─────────────┴─────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                Transport Layer                              │
│        (UDP + WebSocket + Serial)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- ESP32 Development Environment
- Arduino IDE with ESP32 support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/rifatsekerariot/afdx-lite-iot.git
cd afdx-lite-iot
```

2. **Install dependencies**
```bash
npm install
cd src/web-dashboard && npm install
```

3. **Start the gateway**
```bash
npm start
```

4. **Access the dashboard**
Open http://localhost:3000 in your browser

### ESP32 Setup

1. **Install required libraries**:
   - ArduinoJson
   - WiFi (built-in)

2. **Configure and flash**:
   - Open `src/firmware/esp32_afdx_client.ino`
   - Update WiFi credentials
   - Set device ID and slot
   - Upload to ESP32

---

## 📊 Dashboard Features

### 🎛️ Real-time Monitoring
- **Live Device Status**: Connection status and health
- **Performance Metrics**: Latency, throughput, packet statistics
- **Network Topology**: Device list with slot assignments
- **System Health**: CPU, memory, and network utilization

### 📈 Data Visualization
- **Latency Charts**: Real-time latency monitoring
- **Throughput Graphs**: Message rate visualization
- **Alert History**: System and device alerts
- **Device Statistics**: Per-device performance metrics

### ⚙️ Device Management
- **Device Registration**: Manual device addition
- **Slot Assignment**: TDMA slot configuration
- **Status Monitoring**: Online/offline tracking
- **Configuration**: Device parameter management

---

## 🔧 Configuration

### Network Settings
```javascript
{
  "network": {
    "udpPort": 5005,
    "httpPort": 3000,
    "broadcastIP": "255.255.255.255",
    "socketTimeout": 1000
  }
}
```

### TDMA Configuration
```javascript
{
  "tdma": {
    "syncInterval": 1000,
    "slotDuration": 10,
    "frameSize": 1000,
    "maxSlots": 100
  }
}
```

---

## 📡 Protocol Specification

### Message Types
- **SYNC**: Time synchronization broadcast
- **DATA**: Regular sensor data
- **ALERT**: Emergency notifications
- **JOIN**: Device registration request
- **LEAVE**: Device disconnection
- **HEARTBEAT**: Keep-alive messages

### Packet Format
```
Header (8B) | Payload (1-128B)
- Type (1B)
- Device ID (2B)
- Timestamp (4B)
- Priority (1B)
```

---

## 🧪 Testing Results

### Lab Environment Tests
- **Network**: Local WiFi (2.4GHz)
- **Devices**: 2-5 ESP32 DevKit V1
- **Duration**: 24-hour continuous operation
- **Location**: Indoor lab environment

### Performance Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Average Latency | 25ms | <10ms | 🔄 In Progress |
| Packet Loss | 0.5% | <0.1% | 🔄 Improving |
| Sync Accuracy | ±5ms | ±1ms | 🔄 Optimizing |
| Device Capacity | 5 | 100+ | 🔄 Scaling |
| Uptime | 99.5% | 99.9% | ✅ Good |

### Test Scenarios
- **Basic Communication**: ✅ Successful
- **Emergency Alerts**: ✅ Working (<50ms response)
- **Device Failover**: 🔄 Basic implementation
- **Load Testing**: 🔄 Limited to 5 devices
- **Long-term Stability**: ✅ 24+ hours continuous

---

## 🌍 Use Cases

### Current Applications
- **Lab Testing**: Protocol validation and testing
- **Educational**: IoT protocol demonstration
- **Proof of Concept**: Industrial IoT feasibility
- **Research**: Real-time communication studies

### Future Applications
- **Industrial Automation**: Manufacturing process control
- **AGV Coordination**: Autonomous vehicle communication
- **Smart Infrastructure**: Building automation systems
- **Emergency Systems**: Critical alert networks

---

## 🛣️ Development Roadmap

### Phase 1 (Current - Q1 2024)
- [x] Basic TDMA implementation
- [x] ESP32 firmware
- [x] Web dashboard
- [x] SQLite integration
- [ ] Performance optimization
- [ ] Documentation completion

### Phase 2 (Q2 2024)
- [ ] Advanced slot allocation
- [ ] LoRa integration
- [ ] Enhanced security
- [ ] Mobile application
- [ ] Cloud connectivity

### Phase 3 (Q3 2024)
- [ ] AGV real-time features
- [ ] Multi-gateway support
- [ ] Machine learning optimization
- [ ] Industrial certification prep

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Setup
```bash
git clone https://github.com/rifatsekerariot/afdx-lite-iot.git
cd afdx-lite-iot
npm install
npm run dev
```

### Code Standards
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **Jest**: Unit testing (planned)
- **Documentation**: Inline comments required

---

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Documentation**: [GitHub Wiki](https://github.com/rifatsekerariot/afdx-lite-iot/wiki)
- **Issues**: [GitHub Issues](https://github.com/rifatsekerariot/afdx-lite-iot/issues)
- **Email**: rifat.seker@ariot.com.tr
- **LinkedIn**: [Rifat Şeker](https://linkedin.com/in/rifatseker)

---

## 🏆 Acknowledgments

- **Inspiration**: AFDX (ARINC-664) avionics protocol
- **Community**: ESP32 and Node.js communities
- **Testing**: Ariot Teknoloji lab facilities
- **Support**: Open source IoT community

---

**Built with ❤️ by Ariot Teknoloji for the Industrial IoT Community**

*Current Version: 1.0 - Proof of Concept*  
*Next Release: 1.1 - Performance Optimization (Q2 2024)*