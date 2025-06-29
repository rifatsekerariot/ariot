import React from 'react';
import { Menu, Bell, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const Header = ({ onMenuClick }) => {
  const { isConnected, alerts } = useSocket();
  const unreadAlerts = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900">
              AFDX Gateway Control Center
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-success-600" />
                <span className="text-sm text-success-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-danger-600" />
                <span className="text-sm text-danger-600 font-medium">Disconnected</span>
              </>
            )}
          </div>

          {/* Alerts */}
          <div className="relative">
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </button>
          </div>

          {/* System Status */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-success-50 rounded-full">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-success-700 font-medium">System Healthy</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;