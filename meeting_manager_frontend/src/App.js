import React, { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Login from './routes/Login';
import Dashboard from './routes/Dashboard';
import MeetingDetails from './routes/MeetingDetails';
import Settings from './routes/Settings';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App">
      <header className="App-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>

        <nav style={{ marginBottom: 24 }}>
          <NavLink to="/login" className="App-link" style={{ margin: '0 8px' }}>
            Login
          </NavLink>
          <NavLink to="/dashboard" className="App-link" style={{ margin: '0 8px' }}>
            Dashboard
          </NavLink>
          <NavLink to="/meetings/123" className="App-link" style={{ margin: '0 8px' }}>
            Meeting 123
          </NavLink>
          <NavLink to="/settings" className="App-link" style={{ margin: '0 8px' }}>
            Settings
          </NavLink>
        </nav>

        <main style={{ width: '100%', maxWidth: 900, padding: '0 16px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings/:id"
              element={
                <ProtectedRoute>
                  <MeetingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </main>
      </header>
    </div>
  );
}

export default App;
