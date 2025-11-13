import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Dev bypass: allow all routes in local development to avoid OAuth friction.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const isDev = import.meta.env.DEV;
  if (!isAuthenticated && !isDev) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
