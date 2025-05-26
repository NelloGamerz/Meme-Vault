import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthCheck } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthCheck();

  if (isAuthenticated === null) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
