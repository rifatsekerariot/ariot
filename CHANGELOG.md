# Changelog

All notable changes to the AFDX-lite-IoT project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Dynamic slot allocation algorithm
- LoRa communication support
- Enhanced security features
- Performance optimization for sub-10ms latency
- Mobile application for monitoring

## [1.0.0] - 2024-01-15

### Added
- **Core TDMA Implementation**
  - 1-second frames with 10ms time slots
  - UDP broadcast synchronization every 1000ms
  - Fixed slot assignment for devices
  - Priority-based message queuing (A, B, C levels)

- **ESP32 Firmware**
  - Arduino-based client implementation
  - WiFi connectivity with automatic reconnection
  - Time synchronization with gateway
  - Sensor data transmission in assigned slots
  - Emergency alert capability

- **Gateway Server**
  - Node.js/Express-based gateway implementation
  - Real-time TDMA scheduling
  - Device registration and management
  - Message routing and processing
  - SQLite database integration

- **Web Dashboard**
  - React-based real-time monitoring interface
  - Live device status and performance metrics
  - Message history and analytics
  - System health monitoring
  - Responsive design for mobile devices

- **Database Integration**
  - SQLite database for persistent storage
  - Device registration and status tracking
  - Message logging and history
  - Performance metrics storage
  - Automatic data retention policies

- **Monitoring System**
  - Real-time performance metrics collection
  - System health monitoring
  - Alert generation and management
  - WebSocket-based live updates
  - Comprehensive logging

### Technical Specifications
- **Latency**: 15-50ms average (target: <10ms)
- **Sync Accuracy**: ±5ms (target: ±1ms)
- **Device Capacity**: Tested with 2-5 ESP32 devices
- **Reliability**: 99.5% packet delivery rate
- **Uptime**: 24+ hours continuous operation tested

### Testing
- **Environment**: Indoor laboratory with WiFi network
- **Hardware**: ESP32 DevKit V1 boards
- **Duration**: 24-hour stability tests
- **Scenarios**: Basic communication, emergency alerts, device failover

## [0.2.0] - 2024-01-10

### Added
- Enhanced ESP32 firmware with improved error handling
- Basic web dashboard with real-time monitoring
- SQLite database integration for data persistence
- Improved synchronization mechanism
- Device health monitoring and status tracking

### Changed
- Restructured codebase with modular architecture
- Improved packet format with better error detection
- Enhanced configuration management
- Better separation of concerns in gateway code

### Fixed
- WiFi reconnection issues on ESP32
- Sync timeout handling
- Buffer overflow protection in message processing
- Memory leaks in long-running operations

### Performance
- Reduced average latency from 35ms to 25ms
- Improved sync accuracy from ±8ms to ±5ms
- Enhanced packet delivery rate from 98% to 99.5%
- Better stability in 24-hour continuous tests

## [0.1.0] - 2024-01-05

### Added
- **Initial Protocol Implementation**
  - Basic TDMA time slot scheduling
  - UDP-based communication protocol
  - Simple device registration mechanism
  - Priority-based message handling

- **ESP32 Basic Firmware**
  - WiFi connectivity
  - Basic time synchronization
  - Sensor data transmission
  - Simple alert mechanism

- **Gateway Prototype**
  - Python-based slot scheduler
  - UDP packet receiver
  - Basic device management
  - Console-based monitoring

- **Documentation**
  - Initial RFC specification
  - Basic setup instructions
  - Protocol overview documentation

### Technical Details
- **Frame Size**: 1000ms with 10ms slots
- **Message Types**: SYNC, DATA, ALERT, JOIN, LEAVE
- **Priority Levels**: A (Critical), B (Operational), C (Background)
- **Transport**: UDP over WiFi (2.4GHz)

### Testing
- **Devices**: 2 ESP32 boards successfully tested
- **Duration**: 4-hour continuous operation
- **Basic Functionality**: Message transmission and reception working
- **Sync Mechanism**: Basic time synchronization implemented

### Known Issues
- High latency (50-100ms)
- Sync accuracy issues (±10ms)
- Limited error handling
- No persistent storage
- Basic monitoring only

## [0.0.1] - 2024-01-01

### Added
- Project initialization
- Basic project structure
- Initial concept documentation
- Development environment setup
- License and contributing guidelines

### Technical Foundation
- Node.js project structure
- ESP32 development environment
- Basic UDP communication test
- Initial protocol concept

---

## Version Numbering

- **Major version** (X.0.0): Significant protocol changes, breaking compatibility
- **Minor version** (0.X.0): New features, backward compatible
- **Patch version** (0.0.X): Bug fixes, performance improvements

## Release Schedule

- **Patch releases**: As needed for critical fixes
- **Minor releases**: Monthly feature updates
- **Major releases**: Quarterly with significant enhancements

## Support Policy

- **Current version (1.0.x)**: Full support with bug fixes and security updates
- **Previous minor version**: Security updates only
- **Older versions**: Community support only

---

**Maintained by**: Rifat Şeker - Ariot Teknoloji  
**Last Updated**: January 2024  
**Next Release**: v1.1.0 (Planned for April 2024)