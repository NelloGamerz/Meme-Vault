import React from 'react';
import { Button } from '../ui/Button';

interface AuthTabsProps {
  activeTab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex">
      <Button
        variant={activeTab === 'login' ? 'primary' : 'secondary'}
        className="flex-1 rounded-none"
        onClick={() => onTabChange('login')}
      >
        Sign In
      </Button>
      <Button
        variant={activeTab === 'register' ? 'primary' : 'secondary'}
        className="flex-1 rounded-none"
        onClick={() => onTabChange('register')}
      >
        Register
      </Button>
    </div>
  );
};