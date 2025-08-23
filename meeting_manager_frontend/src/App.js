import React, { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './routes/Login';
import Signup from './routes/Signup';
import Dashboard from './routes/Dashboard';
import MeetingDetails from './routes/MeetingDetails';
import Settings from './routes/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';

/**
 * PUBLIC_INTERFACE
 * App
 * Top-level routing configuration. Ensures that:
 * - Auth routes (/login, /signup) render standalone without dashboard navigation/sidebar.
 * - Protected app routes are wrapped in DashboardLayout and require authentication.
 */
import { useAuth } from './context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * RootRedirect
 * Decides where to send the user when landing on "/".
 * - While auth is loading: shows a brief message.
 * - If authenticated: navigates to /dashboard.
 * - Otherwise: navigates to /login.
 */
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Preparing your workspace...
      </div>
    );
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function App() {
  const [theme, setTheme] = useState('light');

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark themes. */
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Container styles for auth pages (centered form, no sidebar/nav)
  const authContainerStyle = {
    width: '100%',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
  };

  return (
    <div className="App">
      <Routes>
        {/* Root route: decide destination based on auth status */}
        <Route
          path="/"
          element={<RootRedirect />}
        />

        {/* Public auth routes - no DashboardLayout, no sidebar */}
        <Route
          path="/login"
          element={
            <div style={authContainerStyle}>
              {/* Minimal theme toggle available on auth pages, fixed position */}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                style={{ position: 'fixed', top: 12, right: 12 }}
              >
                {theme === 'light' ? '\ud83c\udf19 Dark' : '\u2600\ufe0f Light'}
              </button>
              <Login />
            </div>
          }
        />
        <Route
          path="/signup"
          element={
            <div style={authContainerStyle}>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                style={{ position: 'fixed', top: 12, right: 12 }}
              >
                {theme === 'light' ? '\ud83c\udf19 Dark' : '\u2600\ufe0f Light'}
              </button>
              <Signup />
            </div>
          }
        />

        {/* Protected area - requires auth and uses DashboardLayout with sidebar/topbar */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings/:id" element={<MeetingDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;
