import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter,
  Search,
  Bell,
  BellOff,
  Trash2
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const AlertCard = ({ alert, onAcknowledge, onDelete }) => {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'border-l-danger-500 bg-danger-50';
      case 'high':
        return 'border-l-warning-500 bg-warning-50';
      case 'medium':
        return 'border-l-primary-500 bg-primary-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-warning-500 bg-warning-50';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-danger-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      default:
        return <Bell className="w-5 h-5 text-primary-600" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)} ${alert.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getSeverityIcon(alert.severity)}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {alert.type || 'System Alert'}
              </h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                alert.severity === 'critical' ? 'bg-danger-100 text-danger-800' :
                alert.severity === 'high' ? 'bg-warning-100 text-warning-800' :
                'bg-primary-100 text-primary-800'
              }`}>
                {alert.severity || 'Medium'}
              </span>
              {alert.acknowledged && (
                <span className="px-2 py-1 text-xs bg-success-100 text-success-800 rounded-full">
                  Acknowledged
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-700 mt-1">
              {alert.message}
            </p>
            
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(alert.timestamp)}</span>
              </div>
              {alert.deviceId && (
                <span>Device: {alert.deviceId}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!alert.acknowledged && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="p-1 text-success-600 hover:bg-success-100 rounded"
              title="Acknowledge"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(alert.id)}
            className="p-1 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Alerts = () => {
  const { alerts, setAlerts } = useSocket();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');

  const filteredAlerts = alerts
    .filter(alert => {
      const matchesFilter = filter === 'all' || 
        (filter === 'unacknowledged' && !alert.acknowledged) ||
        (filter === 'acknowledged' && alert.acknowledged) ||
        (filter === alert.severity?.toLowerCase());
      
      const matchesSearch = !searchTerm || 
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.deviceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'timestamp') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'severity') {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (severityOrder[b.severity?.toLowerCase()] || 2) - (severityOrder[a.severity?.toLowerCase()] || 2);
      }
      return 0;
    });

  const handleAcknowledge = async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === alertId 
              ? { ...alert, acknowledged: true, acknowledgedAt: Date.now() }
              : alert
          )
        );
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleDelete = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAcknowledgeAll = () => {
    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
    unacknowledgedAlerts.forEach(alert => handleAcknowledge(alert.id));
  };

  const stats = {
    total: alerts.length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600">Monitor and manage system alerts and notifications</p>
        </div>
        
        {stats.unacknowledged > 0 && (
          <button
            onClick={handleAcknowledgeAll}
            className="btn-primary flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Acknowledge All</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <Bell className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unacknowledged</p>
              <p className="text-2xl font-bold text-warning-600">{stats.unacknowledged}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <BellOff className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-danger-600">{stats.critical}</p>
            </div>
            <div className="p-3 bg-danger-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-warning-600">{stats.high}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Alerts</option>
                <option value="unacknowledged">Unacknowledged</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="critical">Critical</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="timestamp">Time</option>
                <option value="severity">Severity</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={handleAcknowledge}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No alerts have been generated yet.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Alerts;