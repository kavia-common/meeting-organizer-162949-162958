import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarView } from '../components/calendar';
import { Button, Input, Modal, ToastContainer } from '../components/common';
import MeetingForm from '../components/meetings/MeetingForm';
import { listMeetings, deleteMeeting, createMeeting } from '../services/meetingsService';
import { useAuth } from '../context/AuthContext';
import { getGoogleAccessToken, fetchGoogleEvents, toMeetingObjects } from '../services/googleIntegrationService';

/**
 * PUBLIC_INTERFACE
 * Dashboard
 * Integrates:
 * - CalendarView with click-to-open details/edit modal
 * - Quick Add / Edit meeting modal using MeetingForm
 * - Search/filter bar
 * - Upcoming meetings list (next 14 days) with inline actions
 * - Data refresh after CRUD actions
 * - Import Google Calendar events
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [dateRange, setDateRange] = useState(() => {
    const s = new Date();
    const e = new Date();
    e.setDate(e.getDate() + 14);
    return { from: s, to: e };
  });
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0); // used to refresh CalendarView indirectly
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState(null);
  const [importing, setImporting] = useState(false);

  const toastRef = useRef(null);

  // Derived filters
  const computedTagsAny = useMemo(() => {
    if (!tagFilter.trim()) return undefined;
    return tagFilter
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagFilter]);

  const refreshCalendar = useCallback(() => {
    // bump a key to signal re-mount which retriggers CalendarView useEffect load
    setCalendarKey((k) => k + 1);
  }, []);

  const showError = (title, description) => {
    toastRef.current?.show({ title, description, type: 'error' });
  };
  const showSuccess = (title, description) => {
    toastRef.current?.show({ title, description, type: 'success' });
  };
  const showInfo = (title, description) => {
    toastRef.current?.show({ title, description, type: 'info' });
  };

  // Load upcoming meetings list
  const loadUpcoming = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        userId: user?.id,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        search: search || undefined,
        tagsAny: computedTagsAny,
        orderBy: 'start_time',
        orderDir: 'asc',
        limit: 200,
      };
      const { data, error } = await listMeetings(params);
      if (error) throw error;
      setUpcoming(Array.isArray(data) ? data : []);
    } catch (err) {
      setUpcoming([]);
      showError('Failed to load upcoming meetings', err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id, dateRange, search, computedTagsAny]);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  // Calendar interaction: clicking a meeting opens details modal with quick actions
  const handleCalendarMeetingClick = (meeting) => {
    setSelectedForDetails(meeting);
    setDetailsOpen(true);
  };

  // Quick Add action
  const onQuickAdd = () => {
    setSelectedForEdit(null);
    setQuickAddOpen(true);
  };

  // Edit from list
  const onEdit = (meeting) => {
    setSelectedForEdit(meeting);
    setQuickAddOpen(true);
  };

  // Delete from list or details
  const onDelete = async (meeting) => {
    if (!meeting?.id) return;
    if (!window.confirm('Delete this meeting? This action cannot be undone.')) return;
    try {
      const { error } = await deleteMeeting(meeting.id);
      if (error) throw error;
      showSuccess('Meeting deleted', 'The meeting has been removed.');
      // refresh list and calendar
      await loadUpcoming();
      refreshCalendar();
      if (detailsOpen) {
        setDetailsOpen(false);
        setSelectedForDetails(null);
      }
    } catch (err) {
      showError('Delete failed', err?.message || 'Unable to delete meeting.');
    }
  };

  // When MeetingForm succeeds, close modal and refresh
  const handleFormSuccess = async () => {
    setQuickAddOpen(false);
    setSelectedForEdit(null);
    await loadUpcoming();
    refreshCalendar();
  };

  // PUBLIC_INTERFACE
  async function importGoogleCalendar(rangeDays = 60) {
    /**
     * Dashboard-level import to refresh both Upcoming list and Calendar afterwards.
     */
    if (!user?.id) {
      showError('Not signed in', 'Please sign in to import events.');
      return;
    }
    setImporting(true);
    try {
      const { accessToken, error: tokenErr } = await getGoogleAccessToken();
      if (tokenErr || !accessToken) {
        throw new Error(tokenErr?.message || 'No Google access token. Connect Google in Settings.');
      }
      const now = new Date();
      const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000).toISOString();
      showInfo('Importing...', 'Fetching Google Calendar events');

      const { events, error: fetchErr } = await fetchGoogleEvents({ accessToken, timeMin, timeMax });
      if (fetchErr) throw new Error(fetchErr.message || 'Failed to fetch Google events');

      const incoming = toMeetingObjects(events || [], user.id);

      // load existing to dedupe
      const { data: existing, error: listErr } = await listMeetings({
        userId: user.id,
        from: timeMin,
        to: timeMax,
        orderBy: 'start_time',
        orderDir: 'asc',
        limit: 1000,
      });
      if (listErr) throw new Error(listErr.message || 'Failed to load existing meetings');

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
      for (const item of unique) {
        if (!item.start_time || !item.end_time || !item.title) continue;
        const { error } = await createMeeting(item);
        if (error) failed += 1;
        else created += 1;
      }
      const skipped = (incoming?.length || 0) - created - failed;

      if (created > 0) {
        showSuccess('Import complete', `Added ${created} new event(s). Skipped ${skipped}.`);
      } else {
        showInfo('Nothing to import', `No new events found. Skipped ${skipped}.`);
      }

      // Refresh UI
      await loadUpcoming();
      refreshCalendar();
    } catch (err) {
      showError('Import failed', err?.message || 'Unexpected error during import.');
    } finally {
      setImporting(false);
    }
  }

  // Search & filters UI handlers
  const styles = {
    headerRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 12,
    },
    filters: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr auto',
      gap: 10,
      width: '100%',
    },
    twoCol: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.2fr',
      gap: 16,
      alignItems: 'start',
    },
    card: {
      background: 'var(--surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 12,
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    listItem: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 8,
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 10px',
      background: 'var(--bg-secondary)',
    },
    listMeta: {
      fontSize: 12,
      color: 'var(--text-secondary)',
    },
    actionsRow: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    },
    sectionTitle: {
      margin: '0 0 8px 0',
      fontSize: 16,
      fontWeight: 700,
    },
    row: { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' },
    caption: { fontSize: 12, color: 'var(--muted)' },
  };

  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  const dateInputValue = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return (
    <section>
      <ToastContainer ref={toastRef} />
      <div style={styles.headerRow}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div className="text-muted">Manage your calendar and upcoming meetings</div>
      </div>

      <div style={{ ...styles.card, marginBottom: 12 }}>
        <div style={styles.filters}>
          <Input
            label="Search"
            placeholder="Title, description, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            helperText="Press Enter to apply"
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadUpcoming();
            }}
          />
          <Input
            label="Tags (any)"
            placeholder="e.g., planning, client"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            helperText="Comma separated"
          />
          <div style={{ display: 'grid', gap: 6, alignItems: 'end', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                From
              </label>
              <input
                type="date"
                value={dateInputValue(dateRange.from)}
                onChange={(e) => {
                  const nd = new Date(e.target.value);
                  if (!isNaN(nd)) setDateRange((r) => ({ ...r, from: nd }));
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                To
              </label>
              <input
                type="date"
                value={dateInputValue(dateRange.to)}
                onChange={(e) => {
                  const nd = new Date(e.target.value);
                  if (!isNaN(nd)) setDateRange((r) => ({ ...r, to: nd }));
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Button onClick={loadUpcoming} aria-label="Apply filters">
            Apply
          </Button>
          <Button variant="secondary" onClick={() => {
            setSearch('');
            setTagFilter('');
            const s = new Date();
            const e = new Date(); e.setDate(e.getDate() + 14);
            setDateRange({ from: s, to: e });
            setTimeout(loadUpcoming, 0);
          }}>
            Reset
          </Button>
          <div style={{ flex: 1 }} />
          <Button onClick={onQuickAdd}>➕ Quick add</Button>
        </div>
      </div>

      <div style={styles.twoCol}>
        <div>
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <h2 style={styles.sectionTitle}>Calendar</h2>
              <div style={styles.row}>
                <Button onClick={() => importGoogleCalendar(60)} disabled={importing}>
                  {importing ? 'Importing…' : 'Import Google Calendar'}
                </Button>
                <span className="text-muted" style={styles.caption}>
                  Past week + next 60 days
                </span>
              </div>
            </div>
            {/* key used to force reload after CRUD */}
            <div style={{ marginTop: 8 }}>
              <CalendarView
                key={calendarKey}
                initialView="month"
                enableService={true}
                onMeetingClick={handleCalendarMeetingClick}
                userId={user?.id}
              />
            </div>
          </div>
        </div>
        <div>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>
              Upcoming ({loading ? 'Loading...' : `${upcoming.length}`})
            </h2>
            <div className="text-muted" style={{ marginBottom: 8, fontSize: 12 }}>
              Showing meetings from {dateRange.from.toLocaleDateString()} to {dateRange.to.toLocaleDateString()}
            </div>
            <div style={styles.list}>
              {upcoming.length === 0 && (
                <div className="text-muted">No upcoming meetings in the selected range.</div>
              )}
              {upcoming.map((m) => (
                <div key={m.id} style={styles.listItem}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{m.title}</div>
                    <div style={styles.listMeta}>
                      {formatDateTime(m.start_time)} — {formatDateTime(m.end_time)}
                      {m.location ? ` • ${m.location}` : ''}
                    </div>
                    {Array.isArray(m.tags) && m.tags.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {m.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              padding: '2px 6px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 6,
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              background: 'var(--bg-primary)',
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={styles.actionsRow}>
                    <Button variant="secondary" onClick={() => onEdit(m)}>Edit</Button>
                    <Button variant="secondary" onClick={() => onDelete(m)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add / Edit Modal */}
      <Modal
        open={quickAddOpen}
        onClose={() => {
          setQuickAddOpen(false);
          setSelectedForEdit(null);
        }}
        title={selectedForEdit ? 'Edit meeting' : 'Quick add meeting'}
        footer={null}
      >
        <MeetingForm
          mode={selectedForEdit ? 'edit' : 'create'}
          initialValues={selectedForEdit || {}}
          userId={user?.id}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setQuickAddOpen(false);
            setSelectedForEdit(null);
          }}
        />
      </Modal>

      {/* Details Modal for calendar click with inline actions */}
      <Modal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedForDetails(null);
        }}
        title={selectedForDetails?.title || 'Meeting'}
        footer={
          selectedForDetails && (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  // open edit using same modal as quick add
                  setDetailsOpen(false);
                  setSelectedForEdit(selectedForDetails);
                  setQuickAddOpen(true);
                }}
              >
                Edit
              </Button>
              <Button variant="secondary" onClick={() => onDelete(selectedForDetails)}>
                Delete
              </Button>
              <Button
                onClick={() => {
                  setDetailsOpen(false);
                  setSelectedForDetails(null);
                }}
              >
                Close
              </Button>
            </>
          )
        }
      >
        {selectedForDetails ? (
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <div>
              <strong>When: </strong>
              {formatDateTime(selectedForDetails.start_time)} — {formatDateTime(selectedForDetails.end_time)}
            </div>
            {selectedForDetails.location && (
              <div>
                <strong>Location: </strong>
                {selectedForDetails.location}
              </div>
            )}
            {selectedForDetails.description && (
              <div>
                <strong>Description: </strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                  {selectedForDetails.description}
                </div>
              </div>
            )}
            {Array.isArray(selectedForDetails.attendees) && selectedForDetails.attendees.length > 0 && (
              <div>
                <strong>Attendees: </strong>
                {selectedForDetails.attendees.join(', ')}
              </div>
            )}
            {Array.isArray(selectedForDetails.tags) && selectedForDetails.tags.length > 0 && (
              <div>
                <strong>Tags: </strong>
                {selectedForDetails.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      marginRight: 6,
                      padding: '2px 6px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted">No meeting selected.</div>
        )}
      </Modal>
    </section>
  );
}
