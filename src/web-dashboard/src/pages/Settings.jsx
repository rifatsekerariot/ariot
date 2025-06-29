import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Network, 
  Shield, 
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';

const SettingCard = ({ title, description, icon: Icon, children }) => (
  <div className="card">
    <div className="flex items-start space-x-4">
      <div className="p-2 bg-primary-50 rounded-lg">
        <Icon className="w-5 h-5 text-primary-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        {children}
      </div>
    </div>
  </div>
);

const Settings = () => {
  const [settings, setSettings] = useState({
    network: {
      udpPort: 5005,
      httpPort: 3000,
      broadcastIP: '255.255.255.255',
      maxRetries: 3,
      socketTimeout: 1000
    },
    tdma: {
      syncInterval: 1000,
      slotDuration: 10,
      frameSize: 1000,
      maxSlots: 100,
      guardTime: 1
    },
    security: {
      enableEncryption: true,
      enableMAC: true,
      keyRotationInterval: 3600000
    },
    monitoring: {
      metricsInterval: 1000,
      enablePredictive: true,
      alertThresholds: {
        packetLoss: 0.05,
        latency: 100,
        cpuUsage: 80,
        memoryUsage: 85
      }
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleThresholdChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      monitoring: {
        ...prev.monitoring,
        alertThresholds: {
          ...prev.monitoring.alertThresholds,
          [key]: parseFloat(value)
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setHasChanges(false);
        // Show success message
      } else {
        // Show error message
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      // Reset to default values
      setHasChanges(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure AFDX-lite-IoT gateway parameters</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`btn-primary flex items-center space-x-2 ${
              !hasChanges || saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {hasChanges && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <span className="text-warning-800 font-medium">
              You have unsaved changes. Remember to save your configuration.
            </span>
          </div>
        </div>
      )}

      {/* Network Settings */}
      <SettingCard
        title="Network Configuration"
        description="Configure network ports and connection parameters"
        icon={Network}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              UDP Port
            </label>
            <input
              type="number"
              value={settings.network.udpPort}
              onChange={(e) => handleSettingChange('network', 'udpPort', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Port
            </label>
            <input
              type="number"
              value={settings.network.httpPort}
              onChange={(e) => handleSettingChange('network', 'httpPort', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Broadcast IP
            </label>
            <input
              type="text"
              value={settings.network.broadcastIP}
              onChange={(e) => handleSettingChange('network', 'broadcastIP', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Socket Timeout (ms)
            </label>
            <input
              type="number"
              value={settings.network.socketTimeout}
              onChange={(e) => handleSettingChange('network', 'socketTimeout', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </SettingCard>

      {/* TDMA Settings */}
      <SettingCard
        title="TDMA Configuration"
        description="Configure time division multiple access parameters"
        icon={Clock}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sync Interval (ms)
            </label>
            <input
              type="number"
              value={settings.tdma.syncInterval}
              onChange={(e) => handleSettingChange('tdma', 'syncInterval', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slot Duration (ms)
            </label>
            <input
              type="number"
              value={settings.tdma.slotDuration}
              onChange={(e) => handleSettingChange('tdma', 'slotDuration', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frame Size (ms)
            </label>
            <input
              type="number"
              value={settings.tdma.frameSize}
              onChange={(e) => handleSettingChange('tdma', 'frameSize', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Slots
            </label>
            <input
              type="number"
              value={settings.tdma.maxSlots}
              onChange={(e) => handleSettingChange('tdma', 'maxSlots', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </SettingCard>

      {/* Security Settings */}
      <SettingCard
        title="Security Configuration"
        description="Configure encryption and authentication settings"
        icon={Shield}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable Encryption</h4>
              <p className="text-sm text-gray-600">Encrypt all message payloads</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.enableEncryption}
                onChange={(e) => handleSettingChange('security', 'enableEncryption', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable MAC</h4>
              <p className="text-sm text-gray-600">Add message authentication codes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.enableMAC}
                onChange={(e) => handleSettingChange('security', 'enableMAC', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Rotation Interval (ms)
            </label>
            <input
              type="number"
              value={settings.security.keyRotationInterval}
              onChange={(e) => handleSettingChange('security', 'keyRotationInterval', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </SettingCard>

      {/* Monitoring Settings */}
      <SettingCard
        title="Monitoring Configuration"
        description="Configure monitoring intervals and alert thresholds"
        icon={SettingsIcon}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metrics Interval (ms)
            </label>
            <input
              type="number"
              value={settings.monitoring.metricsInterval}
              onChange={(e) => handleSettingChange('monitoring', 'metricsInterval', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable Predictive Monitoring</h4>
              <p className="text-sm text-gray-600">Use ML for anomaly detection</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.monitoring.enablePredictive}
                onChange={(e) => handleSettingChange('monitoring', 'enablePredictive', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Alert Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Packet Loss (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.monitoring.alertThresholds.packetLoss * 100}
                  onChange={(e) => handleThresholdChange('packetLoss', parseFloat(e.target.value) / 100)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latency (ms)
                </label>
                <input
                  type="number"
                  value={settings.monitoring.alertThresholds.latency}
                  onChange={(e) => handleThresholdChange('latency', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPU Usage (%)
                </label>
                <input
                  type="number"
                  value={settings.monitoring.alertThresholds.cpuUsage}
                  onChange={(e) => handleThresholdChange('cpuUsage', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Memory Usage (%)
                </label>
                <input
                  type="number"
                  value={settings.monitoring.alertThresholds.memoryUsage}
                  onChange={(e) => handleThresholdChange('memoryUsage', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Info Panel */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-primary-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-primary-900">Configuration Notes</h4>
            <ul className="text-sm text-primary-800 mt-1 space-y-1">
              <li>• Changes to network settings require a gateway restart</li>
              <li>• TDMA parameters affect all connected devices</li>
              <li>• Security settings are applied to new connections</li>
              <li>• Monitoring thresholds trigger automatic alerts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;