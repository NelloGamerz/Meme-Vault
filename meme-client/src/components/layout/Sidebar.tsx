import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Settings, LogOut, User, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Create with AI', path: '/create' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="h-full w-72 bg-white border-r border-gray-200 flex flex-col py-6 px-3 shadow-lg lg:shadow-none">
      <div className="flex items-center justify-between mb-8 px-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          MemeVault
        </h1>
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-gray-100 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-700'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <button
          onClick={() => handleNavigation(`/profile/${user.userId}`)}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <User className="w-6 h-6" />
          <span className="font-medium">Profile</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-red-600 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};