const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = config.database.path;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Open database connection
      this.db = new sqlite3.Database(this.dbPath);
      
      // Enable WAL mode for better performance
      await this.run('PRAGMA journal_mode=WAL');
      await this.run('PRAGMA synchronous=NORMAL');
      await this.run('PRAGMA cache_size=10000');
      
      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    const tables = [
      // Devices table
      `CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        ip_address TEXT NOT NULL,
        slot_id INTEGER,
        priority TEXT DEFAULT 'B',
        bandwidth INTEGER DEFAULT 1000,
        status TEXT DEFAULT 'OFFLINE',
        first_seen INTEGER NOT NULL,
        last_seen INTEGER NOT NULL,
        total_messages INTEGER DEFAULT 0,
        total_alerts INTEGER DEFAULT 0
      )`,

      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        priority TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        sequence_number INTEGER,
        payload TEXT,
        latency REAL,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )`,

      // Alerts table
      `CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        acknowledged_at INTEGER,
        data TEXT,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )`,

      // Metrics table
      `CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        metric_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        value REAL NOT NULL,
        device_id TEXT,
        metadata TEXT
      )`,

      // Events table
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        source TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT DEFAULT 'INFO',
        data TEXT
      )`,

      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        last_activity INTEGER NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )`,

      // Configuration table
      `CREATE TABLE IF NOT EXISTS configuration (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        updated_by TEXT
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages (device_id)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts (device_id)',
      'CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions (device_id)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Device management
  async saveDevice(device) {
    const sql = `
      INSERT OR REPLACE INTO devices 
      (id, ip_address, slot_id, priority, bandwidth, status, first_seen, last_seen, total_messages, total_alerts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      device.id,
      device.ip,
      device.slotId,
      device.priority || 'B',
      device.bandwidth || 1000,
      device.status || 'ONLINE',
      device.firstSeen || Date.now(),
      device.lastSeen || Date.now(),
      device.totalMessages || 0,
      device.totalAlerts || 0
    ];

    return await this.run(sql, params);
  }

  async getDevice(deviceId) {
    const sql = 'SELECT * FROM devices WHERE id = ?';
    return await this.get(sql, [deviceId]);
  }

  async getAllDevices() {
    const sql = 'SELECT * FROM devices ORDER BY last_seen DESC';
    return await this.all(sql);
  }

  async updateDeviceStatus(deviceId, status) {
    const sql = 'UPDATE devices SET status = ?, last_seen = ? WHERE id = ?';
    return await this.run(sql, [status, Date.now(), deviceId]);
  }

  // Message logging
  async saveMessage(message) {
    const sql = `
      INSERT INTO messages 
      (device_id, message_type, priority, timestamp, sequence_number, payload, latency)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      message.deviceId,
      message.type,
      message.priority,
      message.timestamp,
      message.sequence,
      JSON.stringify(message.payload),
      message.latency
    ];

    const result = await this.run(sql, params);
    
    // Update device message count
    await this.run(
      'UPDATE devices SET total_messages = total_messages + 1, last_seen = ? WHERE id = ?',
      [message.timestamp, message.deviceId]
    );

    return result;
  }

  async getMessages(deviceId = null, limit = 1000, offset = 0) {
    let sql = 'SELECT * FROM messages';
    let params = [];
    
    if (deviceId) {
      sql += ' WHERE device_id = ?';
      params.push(deviceId);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    return await this.all(sql, params);
  }

  // Alert management
  async saveAlert(alert) {
    const sql = `
      INSERT INTO alerts 
      (device_id, alert_type, severity, message, timestamp, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      alert.deviceId,
      alert.type,
      alert.severity,
      alert.message,
      alert.timestamp,
      JSON.stringify(alert.data)
    ];

    const result = await this.run(sql, params);
    
    // Update device alert count
    await this.run(
      'UPDATE devices SET total_alerts = total_alerts + 1 WHERE id = ?',
      [alert.deviceId]
    );

    return result;
  }

  async getAlerts(acknowledged = null, limit = 100) {
    let sql = 'SELECT * FROM alerts';
    let params = [];
    
    if (acknowledged !== null) {
      sql += ' WHERE acknowledged = ?';
      params.push(acknowledged ? 1 : 0);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    
    return await this.all(sql, params);
  }

  async acknowledgeAlert(alertId) {
    const sql = 'UPDATE alerts SET acknowledged = 1, acknowledged_at = ? WHERE id = ?';
    return await this.run(sql, [Date.now(), alertId]);
  }

  // Metrics storage
  async saveMetrics(metrics) {
    const timestamp = Date.now();
    const queries = [];

    // Network metrics
    for (const [key, value] of Object.entries(metrics.network)) {
      if (typeof value === 'number') {
        queries.push({
          sql: 'INSERT INTO metrics (timestamp, metric_type, metric_name, value) VALUES (?, ?, ?, ?)',
          params: [timestamp, 'network', key, value]
        });
      }
    }

    // System metrics
    for (const [key, value] of Object.entries(metrics.system)) {
      if (typeof value === 'number') {
        queries.push({
          sql: 'INSERT INTO metrics (timestamp, metric_type, metric_name, value) VALUES (?, ?, ?, ?)',
          params: [timestamp, 'system', key, value]
        });
      }
    }

    // Protocol metrics
    for (const [key, value] of Object.entries(metrics.protocol)) {
      if (typeof value === 'number') {
        queries.push({
          sql: 'INSERT INTO metrics (timestamp, metric_type, metric_name, value) VALUES (?, ?, ?, ?)',
          params: [timestamp, 'protocol', key, value]
        });
      }
    }

    // Execute all queries
    for (const query of queries) {
      await this.run(query.sql, query.params);
    }
  }

  async getMetricsHistory(startTime, endTime, interval = '1m') {
    const sql = `
      SELECT 
        timestamp,
        metric_type,
        metric_name,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        COUNT(*) as count
      FROM metrics 
      WHERE timestamp BETWEEN ? AND ?
      GROUP BY 
        CAST(timestamp / ? AS INTEGER) * ?,
        metric_type,
        metric_name
      ORDER BY timestamp
    `;

    const intervalMs = this.parseInterval(interval);
    const params = [startTime, endTime, intervalMs, intervalMs];
    
    return await this.all(sql, params);
  }

  // Event logging
  async saveEvent(event) {
    const sql = `
      INSERT INTO events 
      (timestamp, event_type, source, description, severity, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      event.timestamp || Date.now(),
      event.type,
      event.source,
      event.description,
      event.severity || 'INFO',
      JSON.stringify(event.data)
    ];

    return await this.run(sql, params);
  }

  async getEventsHistory(startTime, endTime, eventType = null) {
    let sql = 'SELECT * FROM events WHERE timestamp BETWEEN ? AND ?';
    let params = [startTime, endTime];
    
    if (eventType) {
      sql += ' AND event_type = ?';
      params.push(eventType);
    }
    
    sql += ' ORDER BY timestamp DESC';
    
    return await this.all(sql, params);
  }

  // Utility methods
  parseInterval(interval) {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));
    
    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // Default to 1 minute
    }
  }

  async cleanup() {
    const retentionTime = Date.now() - (config.database.retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean old messages
    await this.run('DELETE FROM messages WHERE timestamp < ?', [retentionTime]);
    
    // Clean old metrics
    await this.run('DELETE FROM metrics WHERE timestamp < ?', [retentionTime]);
    
    // Clean old events
    await this.run('DELETE FROM events WHERE timestamp < ?', [retentionTime]);
    
    // Vacuum database
    await this.run('VACUUM');
    
    console.log('Database cleanup completed');
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) console.error('Error closing database:', err);
          else console.log('Database connection closed');
          resolve();
        });
      });
    }
  }
}

module.exports = DatabaseManager;