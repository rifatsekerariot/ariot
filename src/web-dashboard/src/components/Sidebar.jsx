import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  Settings,
  X,
  Wifi
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Devices', href: '/devices', icon: Cpu },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AFDX-lite-IoT</h1>
              <p className="text-xs text-gray-500">Gateway Dashboard</p>
            </div>
          </div>
          
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => setOpen(false)}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>Ariot Teknoloji</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;