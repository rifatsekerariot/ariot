import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Monitoring from './pages/Monitoring';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('/', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to AFDX Gateway');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from AFDX Gateway');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketProvider socket={socket}>
      <Router>
        <div className="flex h-screen bg-gray-50">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;