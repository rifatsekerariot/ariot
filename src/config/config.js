const config = {
  // Network Configuration
  network: {
    udpPort: 5005,
    httpPort: 3000,
    wsPort: 3001,
    broadcastIP: '255.255.255.255',
    maxRetries: 3,
    socketTimeout: 1000,
    heartbeatInterval: 5000
  },

  // TDMA Configuration
  tdma: {
    syncInterval: 1000, // ms
    slotDuration: 10,   // ms
    frameSize: 1000,    // ms
    maxSlots: 100,
    guardTime: 1        // ms
  },

  // Security Configuration
  security: {
    enableEncryption: true,
    encryptionAlgorithm: 'aes-256-gcm',
    keyRotationInterval: 3600000, // 1 hour
    maxMessageAge: 30000, // 30 seconds
    enableMAC: true,
    macAlgorithm: 'sha256'
  },

  // Quality of Service
  qos: {
    priorities: {
      CRITICAL: { level: 0, maxLatency: 10, retries: 5 },
      HIGH: { level: 1, maxLatency: 50, retries: 3 },
      NORMAL: { level: 2, maxLatency: 100, retries: 2 },
      LOW: { level: 3, maxLatency: 500, retries: 1 }
    },
    bufferSizes: {
      CRITICAL: 1000,
      HIGH: 500,
      NORMAL: 200,
      LOW: 100
    }
  },

  // Database Configuration
  database: {
    path: './data/afdx.db',
    maxConnections: 10,
    backupInterval: 3600000, // 1 hour
    retentionDays: 30
  },

  // Monitoring Configuration
  monitoring: {
    metricsInterval: 1000,
    alertThresholds: {
      packetLoss: 0.05,      // 5%
      latency: 100,          // ms
      cpuUsage: 80,          // %
      memoryUsage: 85        // %
    },
    enablePredictive: true
  },

  // Device Management
  devices: {
    maxDevices: 100,
    registrationTimeout: 30000,
    healthCheckInterval: 10000,
    offlineTimeout: 60000
  }
};

module.exports = config;