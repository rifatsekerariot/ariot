import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Wifi, 
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useSocket } from '../contexts/SocketContext';

const MetricCard = ({ title, value, unit, trend, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-danger-600 bg-danger-50'
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center space-x-1 mt-1">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-success-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger-600" />
              )}
              <span className={`text-sm ${trend > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const Monitoring = () => {
  const { metrics, devices, isConnected } = useSocket();
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [latencyData, setLatencyData] = useState([]);
  const [throughputData, setThroughputData] = useState([]);
  const [systemData, setSystemData] = useState([]);
  const [deviceStatusData, setDeviceStatusData] = useState([]);

  useEffect(() => {
    // Generate sample historical data
    const generateData = () => {
      const now = Date.now();
      const points = timeRange === '1h' ? 60 : timeRange === '6h' ? 72 : 144;
      const interval = timeRange === '1h' ? 60000 : timeRange === '6h' ? 300000 : 600000;

      const latency = Array.from({ length: points }, (_, i) => ({
        time: new Date(now - (points - 1 - i) * interval).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        current: Math.random() * 30 + 10,
        average: Math.random() * 25 + 15,
        target: 50
      }));

      const throughput = Array.from({ length: points }, (_, i) => ({
        time: new Date(now - (points - 1 - i) * interval).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        messages: Math.floor(Math.random() * 200) + 50,
        bytes: Math.floor(Math.random() * 10000) + 2000
      }));

      const system = Array.from({ length: points }, (_, i) => ({
        time: new Date(now - (points - 1 - i) * interval).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        cpu: Math.random() * 60 + 20,
        memory: Math.random() * 40 + 30,
        network: Math.random() * 80 + 10
      }));

      setLatencyData(latency);
      setThroughputData(throughput);
      setSystemData(system);
    };

    generateData();
    
    if (autoRefresh) {
      const interval = setInterval(generateData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  useEffect(() => {
    // Update device status pie chart data
    const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
    const offlineDevices = devices.filter(d => d.status === 'OFFLINE').length;
    
    setDeviceStatusData([
      { name: 'Online', value: onlineDevices, color: '#22c55e' },
      { name: 'Offline', value: offlineDevices, color: '#6b7280' }
    ]);
  }, [devices]);

  const networkMetrics = metrics.network || {};
  const systemMetrics = metrics.system || {};
  const protocolMetrics = metrics.protocol || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="text-gray-600">Real-time system and network performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium ${
              autoRefresh 
                ? 'bg-success-100 text-success-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>Auto Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Average Latency"
          value={networkMetrics.averageLatency?.toFixed(1) || '0.0'}
          unit="ms"
          trend={-2.3}
          icon={Clock}
          color="success"
        />
        <MetricCard
          title="Messages/sec"
          value={protocolMetrics.messagesPerSecond?.toFixed(1) || '0.0'}
          unit="/s"
          trend={5.7}
          icon={Activity}
          color="primary"
        />
        <MetricCard
          title="CPU Usage"
          value={systemMetrics.cpuUsage?.toFixed(1) || '0.0'}
          unit="%"
          trend={1.2}
          icon={Cpu}
          color="warning"
        />
        <MetricCard
          title="Active Devices"
          value={protocolMetrics.activeDevices || 0}
          trend={0}
          icon={Wifi}
          color="primary"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Network Latency</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span>Average</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={latencyData}>
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
              <Area 
                type="monotone" 
                dataKey="current" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Throughput Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibol text-gray-900">Message Throughput</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span>Messages</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                <span>Bytes</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar yAxisId="left" dataKey="messages" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="right" dataKey="bytes" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Resources */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={systemData}>
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
                dataKey="cpu" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="CPU %"
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Memory %"
              />
              <Line 
                type="monotone" 
                dataKey="network" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Network %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Device Status */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deviceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            {deviceStatusData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">99.8%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600">15.2ms</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600">0.02%</div>
            <div className="text-sm text-gray-600">Packet Loss</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;