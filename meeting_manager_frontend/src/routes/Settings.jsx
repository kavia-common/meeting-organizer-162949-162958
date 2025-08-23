import React from 'react';
import GoogleConnect from '../components/integrations/GoogleConnect';
import { Button } from '../components/common';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * Settings
 * Settings page that includes integration management (Google OAuth) and placeholders for other preferences.
 */
export default function Settings() {
  const { user } = useAuth();

  const styles = {
    wrapper: { display: 'grid', gap: 16 },
    section: {
      background: 'var(--surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
    },
    grid: { display: 'grid', gap: 12 },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    subTitle: { margin: 0, fontSize: 14, color: 'var(--text-secondary)' },
  };

  return (
    <section>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Settings</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>
          Manage app preferences, account settings, and integrations.
        </p>
      </div>

      <div style={styles.wrapper}>
        <div style={styles.section}>
          <div style={styles.headerRow}>
            <div>
              <h2 style={{ margin: 0 }}>Integrations</h2>
              <p style={styles.subTitle}>Connect third-party services to enhance your experience.</p>
            </div>
            <div>
              {/* Placeholder for "Add Integration" future action */}
              <Button variant="secondary" disabled>
                Coming soon
              </Button>
            </div>
          </div>
          <div style={styles.grid}>
            <GoogleConnect />
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={{ marginTop: 0 }}>Account</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>
            {user ? `Signed in as ${user.email || user.id}` : 'Not signed in'}
          </div>
        </div>
      </div>
    </section>
  );
}
