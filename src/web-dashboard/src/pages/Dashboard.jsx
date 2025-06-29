import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Wifi, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useSocket } from '../contexts/SocketContext';

const StatCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600'
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-success-600' : 'text-danger-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last hour
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { devices, metrics, alerts, messages, isConnected } = useSocket();
  const [latencyData, setLatencyData] = useState([]);
  const [throughputData, setThroughputData] = useState([]);

  useEffect(() => {
    // Generate sample data for charts
    const now = Date.now();
    const sampleLatency = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(now - (19 - i) * 60000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      latency: Math.random() * 50 + 10,
      target: 50
    }));

    const sampleThroughput = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(now - (19 - i) * 60000).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      messages: Math.floor(Math.random() * 100) + 50,
      alerts: Math.floor(Math.random() * 10)
    }));

    setLatencyData(sampleLatency);
    setThroughputData(sampleThroughput);
  }, []);

  const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;
  const avgLatency = metrics.network?.averageLatency || 0;
  const messagesPerSecond = metrics.performance?.messagesPerSecond || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Real-time overview of your AFDX-lite-IoT network</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-500' : 'bg-danger-500'}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {isConnected ? 'Gateway Online' : 'Gateway Offline'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Connected Devices"
          value={onlineDevices}
          icon={Users}
          trend={5.2}
          color="primary"
        />
        <StatCard
          title="Active Alerts"
          value={activeAlerts}
          icon={AlertTriangle}
          trend={-12.5}
          color={activeAlerts > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Avg Latency"
          value={`${avgLatency.toFixed(1)}ms`}
          icon={Clock}
          trend={-2.1}
          color="success"
        />
        <StatCard
          title="Messages/sec"
          value={messagesPerSecond.toFixed(1)}
          icon={TrendingUp}
          trend={8.3}
          color="primary"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Network Latency</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Current</span>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span>Target (50ms)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#d1d5db" 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Throughput Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Message Throughput</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Messages</span>
              <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
              <span>Alerts</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="messages" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="alerts" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.slice(0, 10).map((message, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {message.packet?.header?.deviceId || 'Unknown Device'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {message.packet?.header?.type || 'DATA'} message
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-gray-500 text-center py-8">No recent messages</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cpu className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${metrics.system?.cpuUsage || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{(metrics.system?.cpuUsage || 0).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-success-600" />
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-success-600 h-2 rounded-full" 
                    style={{ width: `${metrics.system?.memoryUsage || 0}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{(metrics.system?.memoryUsage || 0).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-warning-600" />
                <span className="text-sm font-medium text-gray-700">Network Load</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-warning-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm text-gray-600">45%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Protocol Efficiency</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-sm text-gray-600">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;