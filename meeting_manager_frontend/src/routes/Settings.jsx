import React, { useRef, useState } from 'react';
import GoogleConnect from '../components/integrations/GoogleConnect';
import { Button, ToastContainer } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { getGoogleAccessToken, fetchGoogleEvents, toMeetingObjects } from '../services/googleIntegrationService';
import { listMeetings, createMeeting } from '../services/meetingsService';

/**
 * PUBLIC_INTERFACE
 * Settings
 * Settings page that includes integration management (Google OAuth) and placeholders for other preferences.
 */
export default function Settings() {
  const { user } = useAuth();
  const toastRef = useRef(null);
  const [importing, setImporting] = useState(false);

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
    row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
    caption: { fontSize: 12, color: 'var(--muted)' },
  };

  const showInfo = (title, description) => toastRef.current?.show({ title, description, type: 'info' });
  const showSuccess = (title, description) => toastRef.current?.show({ title, description, type: 'success' });
  const showError = (title, description) => toastRef.current?.show({ title, description, type: 'error' });

  // PUBLIC_INTERFACE
  async function importGoogleCalendar(rangeDays = 60) {
    /**
     * Import Google Calendar events for the current user for the next rangeDays.
     * Steps:
     * 1) Get Google access token from session
     * 2) Fetch events from Google
     * 3) Transform into meeting objects
     * 4) Fetch existing meetings for dedupe by external_event_id
     * 5) Insert only unique events into Supabase
     * 6) Show results and allow downstream refresh
     */
    if (!user?.id) {
      showError('Not signed in', 'Please sign in to import events.');
      return { created: 0, skipped: 0, error: new Error('No user') };
    }

    setImporting(true);
    try {
      const { accessToken, error: tokenErr } = await getGoogleAccessToken();
      if (tokenErr || !accessToken) {
        throw new Error(tokenErr?.message || 'No Google access token. Please connect Google from Integrations.');
      }

      const now = new Date();
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // include a week back
      const timeMax = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000).toISOString();
      showInfo('Importing...', 'Fetching Google Calendar events');

      const { events, error: fetchErr } = await fetchGoogleEvents({ accessToken, timeMin, timeMax });
      if (fetchErr) {
        // Surface guidance if likely a permissions issue
        const msg = fetchErr.message || 'Failed to fetch Google events';
        const hint =
          msg.includes('403') || msg.toLowerCase().includes('insufficient')
            ? ' Please reconnect Google and ensure calendar read permissions are granted.'
            : '';
        throw new Error(msg + hint);
      }

      const incoming = toMeetingObjects(events || [], user.id);

      // Fetch existing meetings for dedupe (by external_event_id)
      const { data: existing, error: listErr } = await listMeetings({
        userId: user.id,
        from: timeMin,
        to: timeMax,
        orderBy: 'start_time',
        orderDir: 'asc',
        limit: 1000,
      });
      if (listErr) {
        throw new Error(listErr.message || 'Failed to load existing meetings for dedupe');
      }

      const existingIds = new Set(
        (existing || [])
          .map((m) => m?.external_event_id)
          .filter((x) => typeof x === 'string' && x.length > 0)
      );

      const unique = (incoming || []).filter((m) => {
        const id = m?.external_event_id;
        return !(id && existingIds.has(id));
      });

      let created = 0;
      let failed = 0;
      // Insert sequentially for clarity and error surfacing. Could be batched as needed.
      for (const item of unique) {
        // Basic guards
        if (!item.start_time || !item.end_time || !item.title) continue;
        const { error } = await createMeeting(item);
        if (error) {
          failed += 1;
        } else {
          created += 1;
        }
      }
      const skipped = (incoming?.length || 0) - created - failed;

      if (created > 0) {
        showSuccess('Import complete', `Added ${created} new event(s). Skipped ${skipped}.`);
      } else {
        showInfo('Nothing to import', `No new events found. Skipped ${skipped}.`);
      }

      return { created, skipped, failed, error: null };
    } catch (err) {
      showError('Import failed', err?.message || 'Unexpected error during import.');
      return { created: 0, skipped: 0, failed: 0, error: err };
    } finally {
      setImporting(false);
    }
  }

  return (
    <section>
      <ToastContainer ref={toastRef} />
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
            <div className="text-muted" style={styles.caption}>
              Tip: Connect Google below, then import events.
            </div>
          </div>
          <div style={styles.grid}>
            <GoogleConnect />
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={styles.row}>
                <Button onClick={() => importGoogleCalendar(60)} disabled={importing}>
                  {importing ? 'Importing…' : 'Import Google Calendar'}
                </Button>
                <span className="text-muted" style={styles.caption}>
                  Imports events from your primary Google Calendar for the past week and next 60 days.
                </span>
              </div>
            </div>
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
