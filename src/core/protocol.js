const crypto = require('crypto');
const config = require('../config/config');

class AFDXProtocol {
  constructor() {
    this.messageTypes = {
      SYNC: 'SYNC',
      DATA: 'DATA',
      ALERT: 'ALERT',
      ACK: 'ACK',
      JOIN: 'JOIN',
      LEAVE: 'LEAVE',
      HEARTBEAT: 'HEARTBEAT'
    };
    
    this.priorities = {
      A: 0, // Critical
      B: 1, // Operational  
      C: 2  // Background
    };
    
    this.encryptionKey = this.generateKey();
    this.sequenceNumbers = new Map();
  }

  generateKey() {
    return crypto.randomBytes(32);
  }

  createPacket(type, deviceId, payload, priority = 'B') {
    const timestamp = Date.now();
    const sequence = this.getNextSequence(deviceId);
    
    const packet = {
      header: {
        version: '1.0',
        type: type,
        timestamp: timestamp,
        sequence: sequence,
        deviceId: deviceId,
        priority: priority
      },
      payload: payload
    };

    if (config.security.enableEncryption) {
      packet.encrypted = this.encrypt(JSON.stringify(packet.payload));
      delete packet.payload;
    }

    if (config.security.enableMAC) {
      packet.mac = this.generateMAC(packet);
    }

    return packet;
  }

  parsePacket(rawData) {
    try {
      const packet = JSON.parse(rawData);
      
      // Verify MAC if enabled
      if (config.security.enableMAC && !this.verifyMAC(packet)) {
        throw new Error('MAC verification failed');
      }

      // Check message age
      const age = Date.now() - packet.header.timestamp;
      if (age > config.security.maxMessageAge) {
        throw new Error('Message too old');
      }

      // Decrypt if needed
      if (packet.encrypted) {
        packet.payload = JSON.parse(this.decrypt(packet.encrypted));
        delete packet.encrypted;
      }

      return packet;
    } catch (error) {
      throw new Error(`Packet parsing failed: ${error.message}`);
    }
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(config.security.encryptionAlgorithm, this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher(config.security.encryptionAlgorithm, this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateMAC(packet) {
    const data = JSON.stringify(packet.header) + (packet.payload ? JSON.stringify(packet.payload) : '');
    return crypto.createHmac(config.security.macAlgorithm, this.encryptionKey)
                 .update(data)
                 .digest('hex');
  }

  verifyMAC(packet) {
    const receivedMAC = packet.mac;
    delete packet.mac;
    const calculatedMAC = this.generateMAC(packet);
    packet.mac = receivedMAC;
    return receivedMAC === calculatedMAC;
  }

  getNextSequence(deviceId) {
    const current = this.sequenceNumbers.get(deviceId) || 0;
    const next = (current + 1) % 65536;
    this.sequenceNumbers.set(deviceId, next);
    return next;
  }

  validateSequence(deviceId, sequence) {
    const expected = this.sequenceNumbers.get(deviceId) || 0;
    return sequence === expected;
  }
}

module.exports = AFDXProtocol;