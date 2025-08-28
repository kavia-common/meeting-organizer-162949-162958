import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Avatar,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * DashboardLayout refactored to use Shadcn-like primitives.
 * - Collapsible sidebar (desktop) with Tooltip labels when collapsed.
 * - Mobile drawer using Sheet.
 * - Navigation limited to Calendar, Meetings, Settings (Search removed).
 *
 * Usage:
 *   <Route element={<DashboardLayout />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     <Route path="/meetings" element={<Meetings />} />
 *     <Route path="/settings" element={<Settings />} />
 *   </Route>
 */
export default function DashboardLayout() {
  // Sidebar collapsed state (desktop)
  const [collapsed, setCollapsed] = useState(false);
  // Mobile sheet open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Icons are simple unicode/emoji placeholders; can be swapped with lucide icons later.
  const navItems = useMemo(
    () => [
      { to: '/dashboard', label: 'Calendar', icon: '📅' },
      { to: '/meetings', label: 'Meetings', icon: '📓' },
      { to: '/settings', label: 'Settings', icon: '⚙️' },
    ],
    []
  );

  // Layout styles using CSS variables present in the project
  const styles = {
    root: {
      display: 'grid',
      gridTemplateColumns: collapsed ? '72px 1fr' : '240px 1fr',
      gridTemplateRows: '56px 1fr',
      gridTemplateAreas: `
        "sidebar topbar"
        "sidebar main"
      `,
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      transition: 'grid-template-columns 0.2s ease, background-color 0.3s ease, color 0.3s ease',
    },
    sidebar: {
      gridArea: 'sidebar',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: collapsed ? '12px 8px' : '16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: collapsed ? 'center' : 'stretch',
    },
    brand: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 8,
      width: '100%',
      textAlign: collapsed ? 'center' : 'left',
    },
    nav: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    navLinkBase: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 8,
      color: 'var(--text-primary)',
      textDecoration: 'none',
      border: '1px solid transparent',
      transition: 'all 0.2s ease',
      fontSize: 14,
      fontWeight: 500,
      justifyContent: collapsed ? 'center' : 'flex-start',
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
      padding: '0 12px',
      gap: 8,
    },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: 8 },
    topbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
    iconButton: {
      padding: '6px 8px',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      background: 'var(--bg-primary)',
      fontSize: 14,
    },
    main: {
      gridArea: 'main',
      padding: 16,
      width: '100%',
      boxSizing: 'border-box',
    },
    // Mobile-only helpers (not using CSS media queries here; controlled via visibility buttons)
    sheetContent: {
      width: 260,
      maxWidth: '85vw',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      padding: 12,
    },
    collapsedLabel: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: collapsed ? 'none' : 'inline',
    },
    icon: { width: 20, textAlign: 'center' },
  };

  const linkStyle = ({ isActive }) => ({
    ...styles.navLinkBase,
    ...(isActive ? styles.navLinkActive : {}),
  });

  const SidebarContent = ({ isCollapsed }) => (
    <div>
      <div style={styles.brand}>{isCollapsed ? 'M' : 'Meetings'}</div>
      <Separator />
      <nav style={{ ...styles.nav, marginTop: 8 }}>
        <TooltipProvider>
          {navItems.map((item) => {
            const link = (
              <NavLink key={item.to} to={item.to} style={linkStyle} end>
                <span aria-hidden="true" style={styles.icon}>{item.icon}</span>
                <span style={styles.collapsedLabel}>{item.label}</span>
              </NavLink>
            );
            return isCollapsed ? (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </TooltipProvider>
      </nav>
    </div>
  );

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login', { replace: true });
    } else {
      // eslint-disable-next-line no-console
      console.error('[DashboardLayout] signOut error:', error);
    }
  };

  return (
    <div style={styles.root}>
      {/* Desktop sidebar */}
      <aside style={styles.sidebar} aria-label="Sidebar navigation">
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* Topbar */}
      <header style={styles.topbar} aria-label="Top bar">
        <div style={styles.topbarLeft}>
          {/* Mobile: open sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button type="button" style={styles.iconButton} aria-label="Open menu (mobile)">
                ☰
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="mm-sheet-inline" style={styles.sheetContent}>
              <SidebarContent isCollapsed={false} />
            </SheetContent>
          </Sheet>
          {/* Desktop: collapse/expand */}
          <button
            type="button"
            style={styles.iconButton}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '➡️' : '⬅️'}
          </button>
          <div style={{ fontWeight: 600 }}>Dashboard</div>
        </div>
        <div style={styles.topbarRight}>
          {/* Theme toggle placeholder can be replaced with actual theme wiring if needed */}
          <span style={styles.iconButton} aria-label="Theme toggle">
            Theme
          </span>

          {/* User Menu using Dropdown + Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open user menu"
                className="mm-btn mm-btn--ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 9999, padding: 4 }}
              >
                <Avatar
                  name={user?.email || user?.user_metadata?.full_name || 'User'}
                  size={28}
                />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {user?.email || user?.user_metadata?.full_name || 'Account'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleSignOut();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main} role="main">
        <Outlet />
      </main>
    </div>
  );
}
