const crypto = require('crypto');
const config = require('../config/config');

class SecurityManager {
  constructor() {
    this.deviceKeys = new Map();
    this.sessionKeys = new Map();
    this.nonces = new Map();
    this.keyRotationTimer = null;
    this.masterKey = this.generateMasterKey();
    this.startKeyRotation();
  }

  generateMasterKey() {
    return crypto.randomBytes(32);
  }

  registerDevice(deviceId, publicKey) {
    // Generate device-specific key
    const deviceKey = crypto.randomBytes(32);
    this.deviceKeys.set(deviceId, {
      key: deviceKey,
      publicKey: publicKey,
      registeredAt: Date.now(),
      lastUsed: Date.now()
    });

    return this.encryptWithMaster(deviceKey);
  }

  authenticateDevice(deviceId, challenge, signature) {
    const deviceInfo = this.deviceKeys.get(deviceId);
    if (!deviceInfo) {
      throw new Error('Device not registered');
    }

    // Verify signature using device's public key
    const verify = crypto.createVerify('SHA256');
    verify.update(challenge);
    const isValid = verify.verify(deviceInfo.publicKey, signature, 'hex');

    if (isValid) {
      deviceInfo.lastUsed = Date.now();
      return this.generateSessionKey(deviceId);
    }

    throw new Error('Authentication failed');
  }

  generateSessionKey(deviceId) {
    const sessionKey = crypto.randomBytes(32);
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    this.sessionKeys.set(sessionId, {
      deviceId: deviceId,
      key: sessionKey,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
    });

    return {
      sessionId: sessionId,
      sessionKey: this.encryptWithDeviceKey(deviceId, sessionKey)
    };
  }

  encryptMessage(sessionId, message) {
    const session = this.sessionKeys.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new Error('Invalid or expired session');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', session.key);
    cipher.setAAD(Buffer.from(sessionId));
    
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encrypted: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decryptMessage(sessionId, encryptedData) {
    const session = this.sessionKeys.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      throw new Error('Invalid or expired session');
    }

    const decipher = crypto.createDecipher('aes-256-gcm', session.key);
    decipher.setAAD(Buffer.from(sessionId));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  generateNonce(deviceId) {
    const nonce = crypto.randomBytes(16).toString('hex');
    this.nonces.set(deviceId, {
      nonce: nonce,
      timestamp: Date.now(),
      used: false
    });
    return nonce;
  }

  validateNonce(deviceId, nonce) {
    const nonceInfo = this.nonces.get(deviceId);
    if (!nonceInfo || nonceInfo.used || nonceInfo.nonce !== nonce) {
      return false;
    }

    // Check if nonce is not too old (5 minutes)
    if (Date.now() - nonceInfo.timestamp > 300000) {
      this.nonces.delete(deviceId);
      return false;
    }

    nonceInfo.used = true;
    return true;
  }

  encryptWithMaster(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.masterKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  encryptWithDeviceKey(deviceId, data) {
    const deviceInfo = this.deviceKeys.get(deviceId);
    if (!deviceInfo) {
      throw new Error('Device key not found');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', deviceInfo.key);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  startKeyRotation() {
    this.keyRotationTimer = setInterval(() => {
      this.rotateKeys();
    }, config.security.keyRotationInterval);
  }

  rotateKeys() {
    console.log('Rotating encryption keys...');
    
    // Generate new master key
    this.masterKey = this.generateMasterKey();
    
    // Rotate device keys for active devices
    for (const [deviceId, deviceInfo] of this.deviceKeys) {
      if (Date.now() - deviceInfo.lastUsed < 3600000) { // Active in last hour
        deviceInfo.key = crypto.randomBytes(32);
      }
    }
    
    // Clean up expired sessions
    for (const [sessionId, session] of this.sessionKeys) {
      if (session.expiresAt < Date.now()) {
        this.sessionKeys.delete(sessionId);
      }
    }
    
    // Clean up old nonces
    for (const [deviceId, nonceInfo] of this.nonces) {
      if (Date.now() - nonceInfo.timestamp > 300000) {
        this.nonces.delete(deviceId);
      }
    }
  }

  stop() {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }
  }
}

module.exports = SecurityManager;