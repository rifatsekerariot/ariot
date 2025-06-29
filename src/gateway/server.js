const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const cron = require('node-cron');

const config = require('../config/config');
const AFDXGateway = require('./gateway');
const DatabaseManager = require('../database/manager');
const MonitoringSystem = require('../core/monitoring');

class AFDXServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.gateway = new AFDXGateway();
    this.database = new DatabaseManager();
    this.monitoring = new MonitoringSystem();
    
    this.setupLogger();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupCronJobs();
  }

  setupLogger() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'afdx-gateway' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.static('src/web-dashboard/dist'));
    
    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // API Routes
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'running',
        uptime: process.uptime(),
        version: '1.0.0',
        devices: this.gateway.getConnectedDevices().length,
        health: this.monitoring.getHealthStatus()
      });
    });

    this.app.get('/api/devices', (req, res) => {
      res.json(this.gateway.getConnectedDevices());
    });

    this.app.get('/api/metrics', (req, res) => {
      res.json(this.monitoring.getMetrics());
    });

    this.app.get('/api/alerts', (req, res) => {
      const unacknowledgedOnly = req.query.unacknowledged === 'true';
      res.json(this.monitoring.getAlerts(unacknowledgedOnly));
    });

    this.app.post('/api/alerts/:id/acknowledge', (req, res) => {
      const success = this.monitoring.acknowledgeAlert(req.params.id);
      res.json({ success });
    });

    this.app.get('/api/slots', (req, res) => {
      res.json(this.gateway.getSlotTable());
    });

    this.app.post('/api/devices/:id/remove', (req, res) => {
      const success = this.gateway.removeDevice(req.params.id);
      res.json({ success });
    });

    // Configuration endpoints
    this.app.get('/api/config', (req, res) => {
      res.json(config);
    });

    this.app.post('/api/config', (req, res) => {
      try {
        // Update configuration (implement validation)
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Historical data
    this.app.get('/api/history/metrics', async (req, res) => {
      try {
        const { start, end, interval } = req.query;
        const data = await this.database.getMetricsHistory(start, end, interval);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/history/events', async (req, res) => {
      try {
        const { start, end, type } = req.query;
        const data = await this.database.getEventsHistory(start, end, type);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Error handling
    this.app.use((error, req, res, next) => {
      this.logger.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      this.logger.info('Client connected to WebSocket');

      // Send initial data
      socket.emit('status', this.gateway.getStatus());
      socket.emit('metrics', this.monitoring.getMetrics());
      socket.emit('devices', this.gateway.getConnectedDevices());

      // Handle client requests
      socket.on('requestMetrics', () => {
        socket.emit('metrics', this.monitoring.getMetrics());
      });

      socket.on('requestDevices', () => {
        socket.emit('devices', this.gateway.getConnectedDevices());
      });

      socket.on('disconnect', () => {
        this.logger.info('Client disconnected from WebSocket');
      });
    });

    // Forward gateway events to WebSocket clients
    this.gateway.on('deviceConnected', (device) => {
      this.io.emit('deviceConnected', device);
    });

    this.gateway.on('deviceDisconnected', (device) => {
      this.io.emit('deviceDisconnected', device);
    });

    this.gateway.on('messageReceived', (message) => {
      this.io.emit('messageReceived', message);
    });

    this.gateway.on('alertReceived', (alert) => {
      this.io.emit('alertReceived', alert);
    });

    // Forward monitoring events
    this.monitoring.on('alert', (alert) => {
      this.io.emit('systemAlert', alert);
    });

    this.monitoring.on('metricsUpdated', (metrics) => {
      this.io.emit('metricsUpdated', metrics);
    });
  }

  setupCronJobs() {
    // Database cleanup - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      this.logger.info('Running database cleanup');
      await this.database.cleanup();
    });

    // Metrics backup - every hour
    cron.schedule('0 * * * *', async () => {
      const metrics = this.monitoring.getMetrics();
      await this.database.saveMetrics(metrics);
    });

    // Health check - every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      const health = this.monitoring.getHealthStatus();
      if (health.overall !== 'HEALTHY') {
        this.logger.warn('System health degraded', health);
      }
    });
  }

  async start() {
    try {
      // Initialize database
      await this.database.initialize();
      this.logger.info('Database initialized');

      // Start monitoring
      this.monitoring.start();
      this.logger.info('Monitoring system started');

      // Start gateway
      await this.gateway.start();
      this.logger.info('AFDX Gateway started');

      // Start HTTP server
      this.server.listen(config.network.httpPort, () => {
        this.logger.info(`AFDX Server running on port ${config.network.httpPort}`);
        console.log(`🚀 AFDX-lite-IoT Server started`);
        console.log(`📊 Dashboard: http://localhost:${config.network.httpPort}`);
        console.log(`🔌 WebSocket: ws://localhost:${config.network.httpPort}`);
        console.log(`📡 UDP Gateway: ${config.network.udpPort}`);
      });

    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    this.logger.info('Shutting down server...');
    
    await this.gateway.stop();
    this.monitoring.stop();
    await this.database.close();
    
    this.server.close(() => {
      this.logger.info('Server stopped');
      process.exit(0);
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  if (global.afdxServer) {
    await global.afdxServer.stop();
  }
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (global.afdxServer) {
    await global.afdxServer.stop();
  }
});

// Start server
const server = new AFDXServer();
global.afdxServer = server;
server.start();

module.exports = AFDXServer;