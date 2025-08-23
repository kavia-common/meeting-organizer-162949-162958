import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * DashboardLayout provides the main application layout with:
 * - Sidebar navigation to Calendar, Meetings, Search, and Settings
 * - Topbar area with placeholders for "User menu" and "Theme toggle"
 * - Main content area that renders nested route content via React Router's Outlet
 *
 * Usage:
 *   Wrap dashboard-related routes with this layout in your router configuration:
 *     <Route element={<DashboardLayout />}>
 *       <Route path="/dashboard" element={<Dashboard />} />
 *       <Route path="/meetings" element={<Meetings />} />
 *       <Route path="/search" element={<Search />} />
 *       <Route path="/settings" element={<Settings />} />
 *     </Route>
 *
 * Styling:
 *   Uses CSS variables defined in App.css for theme-ready colors.
 *   Inline styles are provided for simplicity and template consistency.
 */
export default function DashboardLayout() {
  // Inline styles to keep this template self-contained and consistent with App.css variables
  const styles = {
    layout: {
      display: 'grid',
      gridTemplateColumns: '240px 1fr',
      gridTemplateRows: '56px 1fr',
      gridTemplateAreas: `
        "sidebar topbar"
        "sidebar main"
      `,
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'background-color 0.3s ease, color 0.3s ease',
    },
    sidebar: {
      gridArea: 'sidebar',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    brand: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 12,
    },
    nav: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    navLink: {
      padding: '10px 12px',
      borderRadius: 8,
      color: 'var(--text-primary)',
      textDecoration: 'none',
      border: '1px solid transparent',
      transition: 'all 0.2s ease',
      fontSize: 14,
      fontWeight: 500,
    },
    navLinkActive: {
      background: 'var(--bg-primary)',
      borderColor: 'var(--border-color)',
    },
    topbar: {
      gridArea: 'topbar',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
    },
    topbarRight: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 14,
      color: 'var(--text-primary)',
    },
    main: {
      gridArea: 'main',
      padding: 16,
      width: '100%',
      boxSizing: 'border-box',
    },
    pill: {
      padding: '6px 10px',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      background: 'var(--bg-primary)',
    },
    mobileNote: {
      marginTop: 8,
      fontSize: 12,
      opacity: 0.7,
    }
  };

  // Helper to compose active styles for NavLink
  const linkClass = ({ isActive }) => ({
    ...styles.navLink,
    ...(isActive ? styles.navLinkActive : {}),
  });

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar} aria-label="Sidebar navigation">
        <div style={styles.brand}>Meetings</div>
        <nav style={styles.nav}>
          <NavLink to="/dashboard" style={linkClass} end>
            📅 Calendar
          </NavLink>
          <NavLink to="/meetings" style={linkClass} end>
            📓 Meetings
          </NavLink>
          <NavLink to="/search" style={linkClass} end>
            🔎 Search
          </NavLink>
          <NavLink to="/settings" style={linkClass} end>
            ⚙️ Settings
          </NavLink>
        </nav>
        <div style={styles.mobileNote}>
          Tip: Use the theme toggle in the top bar to switch light/dark mode.
        </div>
      </aside>

      <header style={styles.topbar} aria-label="Top bar">
        <div style={{ fontWeight: 600 }}>Dashboard</div>
        <div style={styles.topbarRight}>
          <span style={styles.pill} aria-label="Theme toggle placeholder">
            Theme toggle
          </span>
          <span style={styles.pill} aria-label="User menu placeholder">
            User menu
          </span>
        </div>
      </header>

      <main style={styles.main} role="main">
        <Outlet />
      </main>
    </div>
  );
}
