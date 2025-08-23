import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * ProtectedRoute
 * A wrapper component to guard routes that require authentication.
 *
 * Behavior:
 * - While auth is initializing (loading), it renders a simple placeholder (can be replaced with a spinner).
 * - If the user is authenticated, it renders the provided children.
 * - If not authenticated, it redirects to /login and preserves the intended path in location state.
 *
 * Usage:
 *  <ProtectedRoute>
 *    <Dashboard />
 *  </ProtectedRoute>
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a minimal loading indicator while auth state resolves
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Checking authentication...
      </div>
    );
  }

  // If no user, redirect to login and keep the intended destination
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated: render protected children
  return children;
}
