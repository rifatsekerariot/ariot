const EventEmitter = require('events');
const os = require('os');
const config = require('../config/config');

class MonitoringSystem extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      network: {
        packetsReceived: 0,
        packetsSent: 0,
        packetsLost: 0,
        bytesReceived: 0,
        bytesSent: 0,
        averageLatency: 0,
        latencyHistory: []
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        uptime: 0
      },
      protocol: {
        activeDevices: 0,
        activeSessions: 0,
        syncsSent: 0,
        alertsReceived: 0,
        errorsCount: 0
      },
      performance: {
        messagesPerSecond: 0,
        averageProcessingTime: 0,
        queueDepth: 0
      }
    };

    this.alerts = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.performanceCounters = new Map();
    this.startTime = Date.now();
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.emit('metricsUpdated', this.getMetrics());
    }, config.monitoring.metricsInterval);

    console.log('Monitoring system started');
  }

  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log('Monitoring system stopped');
  }

  collectMetrics() {
    // System metrics
    this.metrics.system.cpuUsage = this.getCPUUsage();
    this.metrics.system.memoryUsage = this.getMemoryUsage();
    this.metrics.system.uptime = Date.now() - this.startTime;

    // Performance metrics
    this.updatePerformanceMetrics();
  }

  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - (100 * totalIdle / totalTick);
  }

  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    return ((totalMem - freeMem) / totalMem) * 100;
  }

  updatePerformanceMetrics() {
    const now = Date.now();
    const windowSize = 60000; // 1 minute window

    // Clean old performance data
    for (const [key, timestamps] of this.performanceCounters) {
      const filtered = timestamps.filter(t => now - t < windowSize);
      this.performanceCounters.set(key, filtered);
    }

    // Calculate messages per second
    const messageTimestamps = this.performanceCounters.get('messages') || [];
    this.metrics.performance.messagesPerSecond = messageTimestamps.length / 60;
  }

  recordNetworkMetric(type, value) {
    switch (type) {
      case 'packetReceived':
        this.metrics.network.packetsReceived++;
        this.metrics.network.bytesReceived += value || 0;
        break;
      case 'packetSent':
        this.metrics.network.packetsSent++;
        this.metrics.network.bytesSent += value || 0;
        break;
      case 'packetLost':
        this.metrics.network.packetsLost++;
        break;
      case 'latency':
        this.recordLatency(value);
        break;
    }
  }

  recordLatency(latency) {
    this.metrics.network.latencyHistory.push({
      timestamp: Date.now(),
      value: latency
    });

    // Keep only last 1000 measurements
    if (this.metrics.network.latencyHistory.length > 1000) {
      this.metrics.network.latencyHistory.shift();
    }

    // Calculate average
    const sum = this.metrics.network.latencyHistory.reduce((a, b) => a + b.value, 0);
    this.metrics.network.averageLatency = sum / this.metrics.network.latencyHistory.length;
  }

  recordPerformanceEvent(event) {
    const now = Date.now();
    
    if (!this.performanceCounters.has(event)) {
      this.performanceCounters.set(event, []);
    }
    
    this.performanceCounters.get(event).push(now);
  }

  recordProtocolMetric(type, value) {
    switch (type) {
      case 'deviceConnected':
        this.metrics.protocol.activeDevices++;
        break;
      case 'deviceDisconnected':
        this.metrics.protocol.activeDevices--;
        break;
      case 'sessionCreated':
        this.metrics.protocol.activeSessions++;
        break;
      case 'sessionExpired':
        this.metrics.protocol.activeSessions--;
        break;
      case 'syncSent':
        this.metrics.protocol.syncsSent++;
        break;
      case 'alertReceived':
        this.metrics.protocol.alertsReceived++;
        break;
      case 'error':
        this.metrics.protocol.errorsCount++;
        break;
    }
  }

  checkThresholds() {
    const thresholds = config.monitoring.alertThresholds;
    
    // Check packet loss
    const totalPackets = this.metrics.network.packetsReceived + this.metrics.network.packetsSent;
    const packetLossRate = totalPackets > 0 ? this.metrics.network.packetsLost / totalPackets : 0;
    
    if (packetLossRate > thresholds.packetLoss) {
      this.createAlert('HIGH_PACKET_LOSS', `Packet loss rate: ${(packetLossRate * 100).toFixed(2)}%`);
    }

    // Check latency
    if (this.metrics.network.averageLatency > thresholds.latency) {
      this.createAlert('HIGH_LATENCY', `Average latency: ${this.metrics.network.averageLatency.toFixed(2)}ms`);
    }

    // Check CPU usage
    if (this.metrics.system.cpuUsage > thresholds.cpuUsage) {
      this.createAlert('HIGH_CPU_USAGE', `CPU usage: ${this.metrics.system.cpuUsage.toFixed(2)}%`);
    }

    // Check memory usage
    if (this.metrics.system.memoryUsage > thresholds.memoryUsage) {
      this.createAlert('HIGH_MEMORY_USAGE', `Memory usage: ${this.metrics.system.memoryUsage.toFixed(2)}%`);
    }
  }

  createAlert(type, message, severity = 'WARNING') {
    const alert = {
      id: Date.now().toString(),
      type: type,
      message: message,
      severity: severity,
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    this.emit('alert', alert);
    console.log(`[${severity}] ${type}: ${message}`);
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now()
    };
  }

  getAlerts(unacknowledgedOnly = false) {
    return unacknowledgedOnly 
      ? this.alerts.filter(a => !a.acknowledged)
      : this.alerts;
  }

  getHealthStatus() {
    const thresholds = config.monitoring.alertThresholds;
    const metrics = this.metrics;
    
    const health = {
      overall: 'HEALTHY',
      components: {
        network: 'HEALTHY',
        system: 'HEALTHY',
        protocol: 'HEALTHY'
      },
      score: 100
    };

    let issues = 0;

    // Check network health
    const totalPackets = metrics.network.packetsReceived + metrics.network.packetsSent;
    const packetLossRate = totalPackets > 0 ? metrics.network.packetsLost / totalPackets : 0;
    
    if (packetLossRate > thresholds.packetLoss || metrics.network.averageLatency > thresholds.latency) {
      health.components.network = 'DEGRADED';
      issues++;
    }

    // Check system health
    if (metrics.system.cpuUsage > thresholds.cpuUsage || metrics.system.memoryUsage > thresholds.memoryUsage) {
      health.components.system = 'DEGRADED';
      issues++;
    }

    // Check protocol health
    if (metrics.protocol.errorsCount > 10) { // More than 10 errors
      health.components.protocol = 'DEGRADED';
      issues++;
    }

    // Calculate overall health
    if (issues > 0) {
      health.overall = issues > 1 ? 'CRITICAL' : 'DEGRADED';
      health.score = Math.max(0, 100 - (issues * 25));
    }

    return health;
  }
}

module.exports = MonitoringSystem;