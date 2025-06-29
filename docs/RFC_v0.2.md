# RFC: AFDX-lite-IoT Protocol Specification (v0.2)

**Title**: AFDX-lite-IoT: Lightweight Deterministic Communication Protocol for IoT Networks  
**Author**: Rifat Şeker – Ariot Teknoloji  
**Status**: Draft (v0.2)  
**Date**: January 2024  

---

## 1. Introduction

AFDX-lite-IoT is a lightweight, deterministic communication protocol designed for time-sensitive IoT networks. Inspired by the Avionics Full Duplex Switched Ethernet (AFDX) protocol used in aircraft systems, this protocol adapts core principles for low-power, resource-constrained IoT deployments.

**Current Implementation Status**: Proof of concept with basic TDMA scheduling, tested with 2-5 ESP32 devices in laboratory environment.

---

## 2. Motivation

Current IoT protocols (MQTT, CoAP) lack deterministic timing guarantees required for time-sensitive applications. AFDX-lite-IoT introduces predictable, slot-based communication suitable for:

- Industrial automation systems
- Real-time sensor networks
- Coordinated device control
- Time-critical alert systems

**Design Goals**: Sub-50ms latency, 99%+ reliability, scalable to 100+ devices.

---

## 3. Core Concepts

### 3.1 TDMA Time Slot Scheduling

- **Frame Structure**: 1-second frames divided into 10ms slots
- **Slot Assignment**: Fixed allocation per device during registration
- **Synchronization**: UDP broadcast every 1000ms for time alignment
- **Guard Time**: 1ms between slots to prevent overlap

### 3.2 Priority-Based Messaging

Messages are classified into three priority levels:

- **Priority A (Critical)**: Emergency alerts, safety shutdowns
- **Priority B (Operational)**: Regular sensor data, control commands  
- **Priority C (Background)**: Status updates, diagnostics

Higher priority messages can preempt lower priority transmissions.

### 3.3 Deterministic Access

Each registered device receives:
- Guaranteed time slot for transmission
- Predictable bandwidth allocation
- Collision-free medium access
- Bounded communication latency

---

## 4. Protocol Architecture

### 4.1 Network Topology
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   ESP32-A   │    │   ESP32-B   │    │   ESP32-C   │
│   Slot 0    │    │   Slot 1    │    │   Slot 2    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                  ┌─────────────┐
                  │   Gateway   │
                  │  (Scheduler) │
                  └─────────────┘
```

### 4.2 Protocol Stack
```
┌─────────────────────────────────────┐
│        Application Layer            │
├─────────────────────────────────────┤
│      AFDX-lite-IoT Protocol        │
├─────────────────────────────────────┤
│           UDP Transport             │
├─────────────────────────────────────┤
│            IP Network               │
├─────────────────────────────────────┤
│         WiFi/Ethernet PHY           │
└─────────────────────────────────────┘
```

---

## 5. Message Format

### 5.1 Packet Structure
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┤
│     Message Type    │    Device ID (16-bit)    │   Priority    │
├─────────────────────┴───────────────────────────┴───────────────┤
│                    Timestamp (32-bit)                           │
├─────────────────────────────────────────────────────────────────┤
│  Payload Length   │              Payload (1-128 bytes)         │
├───────────────────┴─────────────────────────────────────────────┤
│                         Payload (continued)                     │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Field Descriptions
- **Message Type** (8-bit): SYNC, DATA, ALERT, JOIN, LEAVE, HEARTBEAT
- **Device ID** (16-bit): Unique device identifier (0-65535)
- **Priority** (8-bit): A=0 (Critical), B=1 (Operational), C=2 (Background)
- **Timestamp** (32-bit): Local device time in milliseconds
- **Payload Length** (8-bit): Payload size in bytes (1-128)
- **Payload** (1-128 bytes): Application-specific data

---

## 6. Protocol Operations

### 6.1 Device Registration (JOIN)
```
Device                    Gateway
  │                         │
  │────── JOIN Request ────→│
  │                         │
  │←───── JOIN Response ────│
  │     (Slot Assignment)   │
```

### 6.2 Time Synchronization (SYNC)
```
Gateway                   All Devices
  │                         │
  │────── SYNC Broadcast ──→│
  │    (Timestamp + Slots)  │
  │                         │
```

### 6.3 Data Transmission (DATA)
```
Device A (Slot 0)         Gateway
  │                         │
  │────── DATA Message ────→│ (at slot time)
  │                         │
  │←───── ACK (optional) ───│
```

### 6.4 Emergency Alert (ALERT)
```
Device                    Gateway
  │                         │
  │────── ALERT Message ───→│ (immediate)
  │                         │
  │←───── ACK ──────────────│
```

---

## 7. Timing Specifications

### 7.1 Frame Structure
- **Frame Duration**: 1000ms
- **Slot Duration**: 10ms (configurable)
- **Guard Time**: 1ms between slots
- **Maximum Slots**: 99 per frame
- **Sync Overhead**: 1ms per frame

### 7.2 Timing Constraints
- **Sync Accuracy**: ±5ms (current), ±1ms (target)
- **Slot Precision**: ±2ms (current), ±0.5ms (target)
- **Message Latency**: 15-50ms (current), <10ms (target)
- **Jitter**: ±10ms (current), ±1ms (target)

---

## 8. Implementation Details

### 8.1 Gateway Implementation
- **Platform**: Node.js with Express framework
- **Database**: SQLite for device and message storage
- **WebSocket**: Real-time dashboard updates
- **Scheduler**: JavaScript-based TDMA slot manager

### 8.2 Device Implementation
- **Platform**: ESP32 with Arduino framework
- **Libraries**: ArduinoJson, WiFi (built-in)
- **Memory**: ~50KB program, ~10KB RAM usage
- **Power**: ~200mA active, sleep mode supported

### 8.3 Communication
- **Transport**: UDP over WiFi (2.4GHz)
- **Port**: 5005 (configurable)
- **Broadcast**: 255.255.255.255 for sync messages
- **Unicast**: Device-to-gateway data transmission

---

## 9. Current Limitations

### 9.1 Scalability
- **Tested Devices**: 2-5 ESP32 units
- **Theoretical Limit**: 99 devices per gateway
- **Network**: Single subnet only
- **Range**: WiFi coverage area (~50m indoor)

### 9.2 Performance
- **Latency**: 15-50ms (higher than target)
- **Sync Accuracy**: ±5ms (needs improvement)
- **Packet Loss**: 0.5% (acceptable for current use)
- **Reliability**: 99.5% uptime in 24-hour tests

### 9.3 Features
- **Security**: Basic AES encryption (not implemented)
- **Redundancy**: No failover mechanisms
- **QoS**: Basic priority handling only
- **Mobility**: Static device positions only

---

## 10. Security Considerations

### 10.1 Current Security
- **Authentication**: None implemented
- **Encryption**: Planned AES-256
- **Integrity**: Basic checksum only
- **Access Control**: Network-level only

### 10.2 Planned Security Features
- **Device Authentication**: Pre-shared keys
- **Message Encryption**: AES-256-GCM
- **Replay Protection**: Timestamp validation
- **Secure Bootstrap**: Certificate-based registration

---

## 11. Use Cases

### 11.1 Current Applications
- **Laboratory Testing**: Protocol validation
- **Educational Demos**: IoT communication concepts
- **Proof of Concept**: Industrial feasibility studies
- **Research Platform**: Real-time protocol research

### 11.2 Target Applications
- **Industrial Automation**: Manufacturing control systems
- **Building Management**: HVAC and lighting control
- **Agricultural IoT**: Sensor network coordination
- **Emergency Systems**: Critical alert networks

---

## 12. Future Enhancements

### 12.1 Short-term (3-6 months)
- **Performance Optimization**: Sub-15ms latency
- **Scalability Testing**: 20+ device validation
- **LoRa Integration**: Long-range communication
- **Enhanced Monitoring**: Detailed analytics

### 12.2 Medium-term (6-12 months)
- **Dynamic Slot Allocation**: Adaptive scheduling
- **Multi-Gateway Support**: Network scaling
- **Advanced Security**: Industrial-grade encryption
- **Machine Learning**: Traffic optimization

### 12.3 Long-term (1-2 years)
- **Real-time Guarantees**: Hard deadline support
- **AGV Coordination**: Autonomous vehicle support
- **Edge Computing**: Distributed processing
- **Industrial Certification**: Standards compliance

---

## 13. Compliance and Standards

### 13.1 Current Compliance
- **IEEE 802.11**: WiFi communication standard
- **UDP/IP**: Standard internet protocols
- **JSON**: Message format standard
- **Open Source**: AGPL-3.0 license

### 13.2 Target Standards
- **IEC 61158**: Industrial communication networks
- **IEEE 802.15.4**: Low-power wireless networks
- **ISO/IEC 27001**: Information security management
- **IEC 61508**: Functional safety standards

---

## 14. Testing and Validation

### 14.1 Test Environment
- **Hardware**: ESP32 DevKit V1 boards
- **Network**: Local WiFi (2.4GHz, WPA2)
- **Gateway**: Raspberry Pi 4 / PC
- **Duration**: 24-hour continuous operation
- **Conditions**: Indoor laboratory environment

### 14.2 Test Results
- **Packet Delivery**: 99.5% success rate
- **Sync Accuracy**: ±5ms average deviation
- **Latency**: 25ms average, 50ms maximum
- **Stability**: 24+ hours continuous operation
- **Device Capacity**: 5 devices tested successfully

---

## 15. Conclusion

AFDX-lite-IoT v0.2 demonstrates a working proof-of-concept for deterministic IoT communication. While current performance meets basic requirements, significant improvements are needed for industrial deployment.

**Key Achievements**:
- Functional TDMA scheduling implementation
- Stable multi-device communication
- Real-time monitoring dashboard
- Extensible protocol architecture

**Next Steps**:
- Performance optimization for sub-10ms latency
- Scalability testing with 20+ devices
- Security implementation and testing
- Industrial use case validation

---

**References**:
1. ARINC-664 Specification: Aircraft Data Network, Part 7
2. IEEE 802.11: Wireless LAN Medium Access Control
3. RFC 768: User Datagram Protocol
4. IEC 61158: Industrial communication networks

---

**Contact Information**:
- **Author**: Rifat Şeker
- **Organization**: Ariot Teknoloji
- **Email**: rifat.seker@ariot.com.tr
- **Repository**: https://github.com/rifatsekerariot/afdx-lite-iot

**Document Version**: 0.2  
**Last Updated**: January 2024  
**Next Review**: April 2024