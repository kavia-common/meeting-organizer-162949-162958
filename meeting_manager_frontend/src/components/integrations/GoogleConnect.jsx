import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common';
import { useToast } from '../ui';
import supabase from '../../lib/supabaseClient';

/**
 * PUBLIC_INTERFACE
 * GoogleConnect
 * A settings integration component that allows the user to connect or disconnect
 * their Google account using Supabase OAuth (Google provider), and shows current status.
 *
 * Behavior:
 * - Detects if the current session has a "google" provider token (access_token) present.
 * - If not connected: shows "Connect Google" which triggers signInWithOAuth('google').
 * - If connected: shows "Disconnect Google", which revokes the provider token and signs the user out to clear the session.
 *   Note: Revocation is attempted using Supabase's auth.revokeSession or unlink-like approach via signOut fallback.
 *
 * Important:
 * - For client apps, Supabase exposes provider tokens via session.provider_token in GOTRUE cookie.
 *   The SDK v2 keeps provider access_token inside session.provider_token or in session.user.identities.
 *   Here we check via user.identities for a provider === 'google' and/or presence of provider_token in session.
 *
 * - Disconnecting a single provider while keeping email/pass session isn't directly supported in GoTrue today.
 *   As a practical UX, we sign the user out to clear the Google-linked session from the browser.
 *   If you want per-provider unlinking, you must implement it server-side using Supabase Admin API.
 *
 * Environment variables required:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * OAuth scopes:
 * - This component requests Google Calendar read scopes:
 *   https://www.googleapis.com/auth/calendar.readonly (required)
 *   https://www.googleapis.com/auth/calendar.events.readonly (kept for compatibility)
 * - Tokens issued with these scopes can be used by googleIntegrationService.fetchGoogleEvents
 *   to make Calendar API calls (v3).
 */
export default function GoogleConnect() {
  const { session, user, loading, signInWithGoogle, signOut } = useAuth();
  const [working, setWorking] = useState(false);
  const { toast } = useToast();

  const showInfo = (title, description) => toast({ title, description });
  const showSuccess = (title, description) => toast({ title, description, variant: 'success' });
  const showError = (title, description) => toast({ title, description, variant: 'destructive' });

  // Determine if Google is connected by inspecting identities and session tokens
  const isGoogleConnected = useMemo(() => {
    // Check identities array on the user object
    const hasGoogleIdentity = Array.isArray(user?.identities)
      ? user.identities.some((i) => i?.provider === 'google')
      : false;

    // Fallback: check for provider_token in session or provider === 'google' info
    const hasProviderToken =
      !!session?.provider_token ||
      !!session?.provider_refresh_token;

    return hasGoogleIdentity || hasProviderToken;
  }, [user?.identities, session?.provider_token, session?.provider_refresh_token]);

  // Attempt to fetch the list of identities from auth to reflect any changes
  useEffect(() => {
    // Optional: refresh user to ensure identities are up-to-date
    // Avoid spamming on each render; run once when component mounts and user exists.
    let ignore = false;
    async function refreshUser() {
      try {
        if (!user) return;
        // Supabase v2: getUser() will refresh user info including identities
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          // eslint-disable-next-line no-console
          console.warn('[GoogleConnect] getUser error:', error.message);
        }
        if (!ignore && data?.user?.id && data.user.id !== user.id) {
          // Not expected, but no-op
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[GoogleConnect] refreshUser exception:', e?.message);
      }
    }
    refreshUser();
    return () => {
      ignore = true;
    };
    // run when user id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // PUBLIC_INTERFACE
  const connect = async () => {
    /** Initiate Google OAuth via Supabase */
    try {
      setWorking(true);
      const { error } = await signInWithGoogle({
        // Redirect back to current origin
        redirectTo:
          (typeof window !== 'undefined' && window.location?.origin) ||
          undefined,
        // Request calendar scopes (readonly is required for listing events).
        // Keep any other necessary scopes as needed.
        scopes:
          'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
        // Force re-consent to ensure new scopes are granted if previously connected without them.
        // access_type=offline may be required to receive long-lived refresh tokens; harmless for our read-only use.
        queryParams: {
          prompt: 'consent',
          access_type: 'offline',
          // Explicitly include scope in query to ensure providers that use queryParams respect it.
          // Some environments rely on 'scopes' top-level option; including here for robustness.
          scope:
            'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
        },
      });
      if (error) {
        showError('Google connection failed', error.message || 'An unexpected error occurred.');
      } else {
        showInfo('Redirecting to Google', 'Complete authentication and return to the app.');
      }
    } catch (e) {
      showError('Google connection failed', e?.message || 'Unexpected error.');
    } finally {
      setWorking(false);
    }
  };

  // PUBLIC_INTERFACE
  const disconnect = async () => {
    /**
     * Disconnecting Google provider on the client typically means clearing the session
     * that contains provider tokens. We sign the user out, which removes the session
     * from the browser. The user will need to sign in again (email/password or otherwise).
     *
     * If a more granular unlink is required, implement a backend endpoint leveraging
     * Supabase Admin API to revoke oauth provider and call it here.
     */
    if (!window.confirm('Disconnect Google account? You will be signed out.')) {
      return;
    }
    try {
      setWorking(true);

      // Try revoking current session (if supported)
      // Note: supabase-js v2 exposes auth.signOut() primarily; revokeSession is not public for client usage
      const { error } = await signOut();
      if (error) {
        showError('Failed to disconnect', error.message || 'Could not sign out.');
      } else {
        showSuccess('Disconnected', 'Your Google account has been disconnected. Please sign in again if needed.');
      }
    } catch (e) {
      showError('Failed to disconnect', e?.message || 'Unexpected error.');
    } finally {
      setWorking(false);
    }
  };

  const styles = {
    card: {
      background: 'var(--surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      display: 'grid',
      gap: 8,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    status: {
      fontSize: 13,
      color: 'var(--text-secondary)',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    badge: (connected) => ({
      padding: '4px 8px',
      borderRadius: 999,
      border: `1px solid ${connected ? '#059669' : 'var(--border-color)'}`,
      background: connected ? '#ecfdf5' : 'var(--bg-secondary)',
      color: connected ? '#065f46' : 'var(--text-secondary)',
      fontSize: 12,
      fontWeight: 700,
    }),
    caption: { fontSize: 12, color: 'var(--muted)' },
  };

  return (
    <section aria-label="Google account connection">
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Google</span>
              <span aria-label={isGoogleConnected ? 'Connected' : 'Not connected'} style={styles.badge(isGoogleConnected)}>
                {isGoogleConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div style={styles.status}>
              {loading
                ? 'Checking connection...'
                : isGoogleConnected
                ? 'Your account is linked to Google. Calendar access may be available depending on granted scopes.'
                : 'Your account is not linked to Google. Connect to enable calendar integrations.'}
            </div>
          </div>
          <div>
            {isGoogleConnected ? (
              <Button variant="secondary" onClick={disconnect} disabled={loading || working}>
                {working ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            ) : (
              <Button onClick={connect} disabled={loading || working}>
                {working ? 'Redirecting...' : 'Connect Google'}
              </Button>
            )}
          </div>
        </div>
        <div style={styles.caption}>
          Tip: When connecting, you may be asked to grant permissions. For calendar features, the app requests read-only access to your calendars and events.
        </div>
      </div>
    </section>
  );
}
