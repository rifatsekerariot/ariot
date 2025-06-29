const EventEmitter = require('events');
const config = require('../config/config');

class TDMAScheduler extends EventEmitter {
  constructor() {
    super();
    this.slots = new Map();
    this.currentCycle = 0;
    this.isRunning = false;
    this.cycleTimer = null;
    this.slotTimers = [];
    this.statistics = {
      cyclesCompleted: 0,
      slotsActivated: 0,
      missedSlots: 0,
      averageLatency: 0
    };
  }

  addDevice(deviceId, priority = 'B', bandwidth = 1000) {
    const slotId = this.findAvailableSlot();
    if (slotId === -1) {
      throw new Error('No available slots');
    }

    const slot = {
      id: slotId,
      deviceId: deviceId,
      priority: priority,
      bandwidth: bandwidth,
      duration: this.calculateSlotDuration(bandwidth),
      active: false,
      statistics: {
        activations: 0,
        missedActivations: 0,
        averageLatency: 0
      }
    };

    this.slots.set(slotId, slot);
    this.emit('deviceAdded', { deviceId, slotId, slot });
    return slotId;
  }

  removeDevice(deviceId) {
    for (const [slotId, slot] of this.slots) {
      if (slot.deviceId === deviceId) {
        this.slots.delete(slotId);
        this.emit('deviceRemoved', { deviceId, slotId });
        return true;
      }
    }
    return false;
  }

  findAvailableSlot() {
    for (let i = 0; i < config.tdma.maxSlots; i++) {
      if (!this.slots.has(i)) {
        return i;
      }
    }
    return -1;
  }

  calculateSlotDuration(bandwidth) {
    // Calculate based on bandwidth requirements
    const baseDuration = config.tdma.slotDuration;
    const factor = bandwidth / 1000; // Normalize to 1000 bps baseline
    return Math.max(baseDuration, Math.ceil(baseDuration * factor));
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.currentCycle = 0;
    this.startCycle();
    this.emit('schedulerStarted');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
    }
    
    this.slotTimers.forEach(timer => clearTimeout(timer));
    this.slotTimers = [];
    
    this.emit('schedulerStopped');
  }

  startCycle() {
    if (!this.isRunning) return;

    const cycleStartTime = Date.now();
    this.currentCycle++;
    
    this.emit('cycleStarted', { 
      cycle: this.currentCycle, 
      timestamp: cycleStartTime,
      slots: Array.from(this.slots.values())
    });

    // Schedule all slots for this cycle
    this.scheduleSlots(cycleStartTime);

    // Schedule next cycle
    this.cycleTimer = setTimeout(() => {
      this.statistics.cyclesCompleted++;
      this.startCycle();
    }, config.tdma.syncInterval);
  }

  scheduleSlots(cycleStartTime) {
    let currentOffset = 0;

    // Sort slots by priority
    const sortedSlots = Array.from(this.slots.values())
      .sort((a, b) => {
        const priorityA = config.qos.priorities[a.priority]?.level || 999;
        const priorityB = config.qos.priorities[b.priority]?.level || 999;
        return priorityA - priorityB;
      });

    sortedSlots.forEach(slot => {
      const slotStartTime = cycleStartTime + currentOffset;
      const delay = Math.max(0, slotStartTime - Date.now());

      const timer = setTimeout(() => {
        this.activateSlot(slot, slotStartTime);
      }, delay);

      this.slotTimers.push(timer);
      currentOffset += slot.duration + config.tdma.guardTime;
    });
  }

  activateSlot(slot, startTime) {
    if (!this.isRunning) return;

    slot.active = true;
    slot.statistics.activations++;
    this.statistics.slotsActivated++;

    const actualStartTime = Date.now();
    const latency = actualStartTime - startTime;
    
    // Update latency statistics
    slot.statistics.averageLatency = 
      (slot.statistics.averageLatency + latency) / 2;

    this.emit('slotActivated', {
      slot: slot,
      cycle: this.currentCycle,
      startTime: actualStartTime,
      latency: latency
    });

    // Deactivate slot after duration
    setTimeout(() => {
      slot.active = false;
      this.emit('slotDeactivated', { slot: slot });
    }, slot.duration);
  }

  getSlotTable() {
    const table = {};
    for (const [slotId, slot] of this.slots) {
      table[slotId] = {
        device_id: slot.deviceId,
        priority: slot.priority,
        duration_ms: slot.duration,
        bandwidth: slot.bandwidth,
        active: slot.active
      };
    }
    return table;
  }

  getStatistics() {
    return {
      ...this.statistics,
      currentCycle: this.currentCycle,
      activeSlots: Array.from(this.slots.values()).filter(s => s.active).length,
      totalSlots: this.slots.size,
      slotUtilization: this.slots.size / config.tdma.maxSlots
    };
  }
}

module.exports = TDMAScheduler;