import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Clock, 
  Activity,
  AlertTriangle,
  Settings,
  Trash2,
  Plus
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const DeviceCard = ({ device, onRemove }) => {
  const isOnline = device.status === 'ONLINE';
  const lastSeen = device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never';
  
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${isOnline ? 'bg-success-50' : 'bg-gray-50'}`}>
            <Cpu className={`w-6 h-6 ${isOnline ? 'text-success-600' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{device.id}</h3>
            <p className="text-sm text-gray-600">{device.ip}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-success-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-sm ${isOnline ? 'text-success-600' : 'text-gray-500'}`}>
                  {device.status}
                </span>
              </div>
              
              {device.slotId !== undefined && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-primary-600">Slot {device.slotId}</span>
                </div>
              )}
              
              {device.priority && (
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-warning-600" />
                  <span className="text-sm text-warning-600">Priority {device.priority}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onRemove(device.id)}
            className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Last Seen:</span>
            <p className="font-medium text-gray-900">{lastSeen}</p>
          </div>
          <div>
            <span className="text-gray-500">Messages:</span>
            <p className="font-medium text-gray-900">{device.totalMessages || 0}</p>
          </div>
          <div>
            <span className="text-gray-500">Bandwidth:</span>
            <p className="font-medium text-gray-900">{device.bandwidth || 1000} bps</p>
          </div>
          <div>
            <span className="text-gray-500">Alerts:</span>
            <p className="font-medium text-gray-900">{device.totalAlerts || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Devices = () => {
  const { devices, socket } = useSocket();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = devices.filter(device => {
    const matchesFilter = filter === 'all' || 
      (filter === 'online' && device.status === 'ONLINE') ||
      (filter === 'offline' && device.status === 'OFFLINE');
    
    const matchesSearch = device.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const handleRemoveDevice = async (deviceId) => {
    if (window.confirm(`Are you sure you want to remove device ${deviceId}?`)) {
      try {
        const response = await fetch(`/api/devices/${deviceId}/remove`, {
          method: 'POST'
        });
        
        if (response.ok) {
          console.log(`Device ${deviceId} removed successfully`);
        } else {
          console.error('Failed to remove device');
        }
      } catch (error) {
        console.error('Error removing device:', error);
      }
    }
  };

  const onlineCount = devices.filter(d => d.status === 'ONLINE').length;
  const offlineCount = devices.filter(d => d.status === 'OFFLINE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-600">Manage and monitor connected IoT devices</p>
        </div>
        
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Device</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Devices</p>
              <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <Cpu className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Online</p>
              <p className="text-2xl font-bold text-success-600">{onlineCount}</p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <Wifi className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-gray-600">{offlineCount}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <WifiOff className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Devices</option>
                <option value="online">Online Only</option>
                <option value="offline">Offline Only</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDevices.map((device) => (
          <DeviceCard 
            key={device.id} 
            device={device} 
            onRemove={handleRemoveDevice}
          />
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="card text-center py-12">
          <Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No devices are currently connected to the gateway.'
            }
          </p>
          {!searchTerm && filter === 'all' && (
            <button className="btn-primary">
              Add Your First Device
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Devices;