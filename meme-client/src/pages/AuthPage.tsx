import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthTabs } from '../components/auth/AuthTabs';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { toast } from "react-hot-toast";

export const AuthPage: React.FC = () => {
  useEffect(() => {
    if (localStorage.getItem("sessionExpired")) {
      toast.error("Session Expired! Please log in again.");
      localStorage.removeItem("sessionExpired"); // Remove flag after showing toast
    }
  }, []);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Check if user is already logged in
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <AuthTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}

            <div className="mt-6 text-center text-sm text-gray-600">
              {activeTab === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setActiveTab('register')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('login')}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};