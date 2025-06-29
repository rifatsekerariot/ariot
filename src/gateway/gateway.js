const dgram = require('dgram');
const EventEmitter = require('events');
const config = require('../config/config');
const AFDXProtocol = require('../core/protocol');
const TDMAScheduler = require('../core/scheduler');
const SecurityManager = require('../core/security');

class AFDXGateway extends EventEmitter {
  constructor() {
    super();
    this.protocol = new AFDXProtocol();
    this.scheduler = new TDMAScheduler();
    this.security = new SecurityManager();
    
    this.socket = null;
    this.isRunning = false;
    this.connectedDevices = new Map();
    
    this.statistics = {
      messagesReceived: 0,
      messagesSent: 0,
      errorsCount: 0,
      startTime: Date.now()
    };

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Scheduler events
    this.scheduler.on('cycleStarted', (data) => {
      this.broadcastSync(data);
    });

    this.scheduler.on('slotActivated', (data) => {
      this.emit('slotActivated', data);
    });

    this.scheduler.on('deviceAdded', (data) => {
      this.emit('deviceConnected', data);
    });

    this.scheduler.on('deviceRemoved', (data) => {
      this.emit('deviceDisconnected', data);
    });
  }

  async start() {
    if (this.isRunning) return;

    try {
      // Create UDP socket
      this.socket = dgram.createSocket('udp4');
      
      // Setup socket event handlers
      this.socket.on('message', (msg, rinfo) => {
        this.handleMessage(msg, rinfo);
      });

      this.socket.on('error', (err) => {
        console.error('Gateway socket error:', err);
        this.emit('error', err);
      });

      // Bind socket
      await new Promise((resolve, reject) => {
        this.socket.bind(config.network.udpPort, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Enable broadcast
      this.socket.setBroadcast(true);

      // Start scheduler
      this.scheduler.start();
      
      this.isRunning = true;
      this.statistics.startTime = Date.now();
      
      console.log(`AFDX Gateway started on UDP port ${config.network.udpPort}`);
      this.emit('started');

    } catch (error) {
      console.error('Failed to start gateway:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    // Stop scheduler
    this.scheduler.stop();
    
    // Stop security manager
    this.security.stop();
    
    // Close socket
    if (this.socket) {
      this.socket.close();
    }
    
    console.log('AFDX Gateway stopped');
    this.emit('stopped');
  }

  handleMessage(buffer, rinfo) {
    try {
      this.statistics.messagesReceived++;
      
      const rawMessage = buffer.toString();
      const packet = this.protocol.parsePacket(rawMessage);
      
      const deviceInfo = {
        id: packet.header.deviceId,
        ip: rinfo.address,
        port: rinfo.port,
        lastSeen: Date.now()
      };

      // Update device info
      this.updateDeviceInfo(deviceInfo);
      
      // Handle different message types
      switch (packet.header.type) {
        case this.protocol.messageTypes.JOIN:
          this.handleJoinRequest(packet, rinfo);
          break;
          
        case this.protocol.messageTypes.DATA:
          this.handleDataMessage(packet, rinfo);
          break;
          
        case this.protocol.messageTypes.ALERT:
          this.handleAlertMessage(packet, rinfo);
          break;
          
        case this.protocol.messageTypes.HEARTBEAT:
          this.handleHeartbeat(packet, rinfo);
          break;
          
        case this.protocol.messageTypes.LEAVE:
          this.handleLeaveRequest(packet, rinfo);
          break;
          
        default:
          console.warn(`Unknown message type: ${packet.header.type}`);
      }

      this.emit('messageReceived', {
        packet: packet,
        device: deviceInfo,
        timestamp: Date.now()
      });

    } catch (error) {
      this.statistics.errorsCount++;
      console.error('Error handling message:', error);
      this.emit('messageError', { error, rinfo });
    }
  }

  handleJoinRequest(packet, rinfo) {
    try {
      const deviceId = packet.header.deviceId;
      const payload = packet.payload;
      
      // Register device with security manager
      if (payload.publicKey) {
        const encryptedKey = this.security.registerDevice(deviceId, payload.publicKey);
        
        // Add device to scheduler
        const slotId = this.scheduler.addDevice(
          deviceId, 
          payload.priority || 'B',
          payload.bandwidth || 1000
        );
        
        // Send JOIN_ACK response
        const response = this.protocol.createPacket(
          this.protocol.messageTypes.ACK,
          'GATEWAY',
          {
            status: 'ACCEPTED',
            slotId: slotId,
            encryptedKey: encryptedKey,
            syncInterval: config.tdma.syncInterval
          }
        );
        
        this.sendMessage(response, rinfo);
        
        console.log(`Device ${deviceId} joined with slot ${slotId}`);
        
      } else {
        // Reject join request
        const response = this.protocol.createPacket(
          this.protocol.messageTypes.ACK,
          'GATEWAY',
          { status: 'REJECTED', reason: 'Missing public key' }
        );
        
        this.sendMessage(response, rinfo);
      }
      
    } catch (error) {
      console.error('Error handling join request:', error);
      
      const response = this.protocol.createPacket(
        this.protocol.messageTypes.ACK,
        'GATEWAY',
        { status: 'ERROR', reason: error.message }
      );
      
      this.sendMessage(response, rinfo);
    }
  }

  handleDataMessage(packet, rinfo) {
    const deviceId = packet.header.deviceId;
    
    // Validate slot timing
    const device = this.connectedDevices.get(deviceId);
    if (device && device.slotId !== undefined) {
      const slot = this.scheduler.slots.get(device.slotId);
      if (slot && !slot.active) {
        console.warn(`Device ${deviceId} transmitted outside of slot`);
        return;
      }
    }
    
    // Process data
    this.emit('dataReceived', {
      deviceId: deviceId,
      data: packet.payload,
      timestamp: packet.header.timestamp,
      priority: packet.header.priority
    });
    
    // Send ACK if required
    if (packet.payload.requiresAck) {
      const ack = this.protocol.createPacket(
        this.protocol.messageTypes.ACK,
        'GATEWAY',
        { messageId: packet.header.sequence }
      );
      
      this.sendMessage(ack, rinfo);
    }
  }

  handleAlertMessage(packet, rinfo) {
    const deviceId = packet.header.deviceId;
    
    console.log(`🚨 ALERT from ${deviceId}: ${packet.payload.message}`);
    
    this.emit('alertReceived', {
      deviceId: deviceId,
      message: packet.payload.message,
      severity: packet.payload.severity || 'HIGH',
      timestamp: packet.header.timestamp,
      data: packet.payload.data
    });
    
    // Always ACK alerts
    const ack = this.protocol.createPacket(
      this.protocol.messageTypes.ACK,
      'GATEWAY',
      { messageId: packet.header.sequence }
    );
    
    this.sendMessage(ack, rinfo);
  }

  handleHeartbeat(packet, rinfo) {
    const deviceId = packet.header.deviceId;
    
    // Update device last seen
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.lastSeen = Date.now();
      device.status = 'ONLINE';
    }
    
    // Send heartbeat response
    const response = this.protocol.createPacket(
      this.protocol.messageTypes.HEARTBEAT,
      'GATEWAY',
      { timestamp: Date.now() }
    );
    
    this.sendMessage(response, rinfo);
  }

  handleLeaveRequest(packet, rinfo) {
    const deviceId = packet.header.deviceId;
    
    // Remove from scheduler
    this.scheduler.removeDevice(deviceId);
    
    // Remove from connected devices
    this.connectedDevices.delete(deviceId);
    
    // Send leave ACK
    const ack = this.protocol.createPacket(
      this.protocol.messageTypes.ACK,
      'GATEWAY',
      { status: 'GOODBYE' }
    );
    
    this.sendMessage(ack, rinfo);
    
    console.log(`Device ${deviceId} left the network`);
  }

  broadcastSync(cycleData) {
    const syncMessage = this.protocol.createPacket(
      this.protocol.messageTypes.SYNC,
      'GATEWAY',
      {
        timestamp: Date.now(),
        cycle: cycleData.cycle,
        slots: this.scheduler.getSlotTable(),
        frameSize: config.tdma.frameSize
      }
    );
    
    const buffer = Buffer.from(JSON.stringify(syncMessage));
    
    this.socket.send(
      buffer, 
      0, 
      buffer.length, 
      config.network.udpPort, 
      config.network.broadcastIP,
      (err) => {
        if (err) {
          console.error('Error broadcasting sync:', err);
        } else {
          this.statistics.messagesSent++;
        }
      }
    );
  }

  sendMessage(packet, rinfo) {
    const buffer = Buffer.from(JSON.stringify(packet));
    
    this.socket.send(
      buffer,
      0,
      buffer.length,
      rinfo.port,
      rinfo.address,
      (err) => {
        if (err) {
          console.error('Error sending message:', err);
        } else {
          this.statistics.messagesSent++;
        }
      }
    );
  }

  updateDeviceInfo(deviceInfo) {
    const existing = this.connectedDevices.get(deviceInfo.id);
    
    if (existing) {
      // Update existing device
      existing.ip = deviceInfo.ip;
      existing.port = deviceInfo.port;
      existing.lastSeen = deviceInfo.lastSeen;
      existing.status = 'ONLINE';
    } else {
      // Add new device
      this.connectedDevices.set(deviceInfo.id, {
        ...deviceInfo,
        status: 'ONLINE',
        connectedAt: Date.now()
      });
    }
  }

  removeDevice(deviceId) {
    const removed = this.scheduler.removeDevice(deviceId);
    if (removed) {
      this.connectedDevices.delete(deviceId);
      return true;
    }
    return false;
  }

  getConnectedDevices() {
    return Array.from(this.connectedDevices.values());
  }

  getSlotTable() {
    return this.scheduler.getSlotTable();
  }

  getStatistics() {
    return {
      ...this.statistics,
      uptime: Date.now() - this.statistics.startTime,
      connectedDevices: this.connectedDevices.size,
      schedulerStats: this.scheduler.getStatistics()
    };
  }

  getStatus() {
    return {
      running: this.isRunning,
      connectedDevices: this.connectedDevices.size,
      activeSlots: Array.from(this.scheduler.slots.values()).filter(s => s.active).length,
      statistics: this.getStatistics()
    };
  }

  // Cleanup offline devices
  cleanupOfflineDevices() {
    const now = Date.now();
    const offlineTimeout = config.devices.offlineTimeout;
    
    for (const [deviceId, device] of this.connectedDevices) {
      if (now - device.lastSeen > offlineTimeout) {
        console.log(`Removing offline device: ${deviceId}`);
        this.removeDevice(deviceId);
        this.emit('deviceTimeout', { deviceId, device });
      }
    }
  }
}

module.exports = AFDXGateway;