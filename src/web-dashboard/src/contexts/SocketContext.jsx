import React, { createContext, useContext, useState, useEffect } from 'react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, socket }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('devices', (deviceList) => {
      setDevices(deviceList);
    });

    socket.on('metricsUpdated', (newMetrics) => {
      setMetrics(newMetrics);
    });

    socket.on('systemAlert', (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 99)]);
    });

    socket.on('alertReceived', (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 99)]);
    });

    socket.on('messageReceived', (message) => {
      setMessages(prev => [message, ...prev.slice(0, 999)]);
    });

    socket.on('deviceConnected', (device) => {
      setDevices(prev => {
        const existing = prev.find(d => d.id === device.deviceId);
        if (existing) {
          return prev.map(d => d.id === device.deviceId ? { ...d, status: 'ONLINE' } : d);
        }
        return [...prev, { id: device.deviceId, status: 'ONLINE', ...device }];
      });
    });

    socket.on('deviceDisconnected', (device) => {
      setDevices(prev => 
        prev.map(d => d.id === device.deviceId ? { ...d, status: 'OFFLINE' } : d)
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('devices');
      socket.off('metricsUpdated');
      socket.off('systemAlert');
      socket.off('alertReceived');
      socket.off('messageReceived');
      socket.off('deviceConnected');
      socket.off('deviceDisconnected');
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    devices,
    metrics,
    alerts,
    messages,
    setDevices,
    setMetrics,
    setAlerts,
    setMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};