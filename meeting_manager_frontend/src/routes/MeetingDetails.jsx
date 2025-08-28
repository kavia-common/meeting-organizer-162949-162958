import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMeeting, deleteMeeting } from '../services/meetingsService';
import MeetingForm from '../components/meetings/MeetingForm';
import { Button, Modal } from '../components/common';
import { useToast } from '../components/ui';

/**
 * PUBLIC_INTERFACE
 * MeetingDetails
 * Fetches and displays a single meeting by id. Provides edit and delete actions.
 * If meeting has source === 'google' and external_event_id, shows link to open in Google Calendar.
 * Includes loading, error, and empty states.
 */
export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  const showError = (title, description) => {
    toast({ title, description, variant: 'destructive' });
  };
  const showSuccess = (title, description) => {
    toast({ title, description, variant: 'success' });
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await getMeeting(id);
      if (error) throw error;
      setMeeting(data);
    } catch (err) {
      // Use consistent, centralized message
      setErrorMsg(err?.message || 'Failed to load meeting.');
      setMeeting(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    if (!meeting?.id) return;
    if (!window.confirm('Delete this meeting? This action cannot be undone.')) return;
    try {
      const { error } = await deleteMeeting(meeting.id);
      if (error) throw error;
      showSuccess('Meeting deleted', 'The meeting has been removed.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Display standardized error
      showError('Delete failed', err?.message || 'Unable to delete meeting.');
    }
  };

  const onEditSuccess = async () => {
    setEditOpen(false);
    await load();
  };

  const googleLink = useMemo(() => {
    if (meeting?.source === 'google' && meeting?.external_event_id) {
      // Standard Google Calendar event URL pattern
      return `https://calendar.google.com/calendar/event?eid=${encodeURIComponent(meeting.external_event_id)}`;
    }
    return null;
  }, [meeting]);

  const styles = {
    card: {
      background: 'var(--surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
    },
    headerRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 8,
    },
    meta: { fontSize: 13, color: 'var(--text-secondary)' },
    tag: {
      padding: '2px 6px',
      border: '1px solid var(--border-color)',
      borderRadius: 6,
      fontSize: 12,
      color: 'var(--text-secondary)',
      background: 'var(--bg-primary)',
    },
    section: { marginTop: 8, display: 'grid', gap: 6 },
    actions: { display: 'flex', gap: 8, alignItems: 'center' },
    link: { color: 'var(--link-color)', textDecoration: 'none' },
    divider: { height: 1, background: 'var(--border-color)', margin: '8px 0' },
  };

  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <section aria-labelledby="meeting-details-title">
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h1 id="meeting-details-title" style={{ margin: 0 }}>
              {meeting?.title || 'Meeting'}
            </h1>
            <div className="text-muted" style={styles.meta}>
              ID: {id}
            </div>
          </div>
          <div style={styles.actions}>
            <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
            {meeting && (
              <>
                <Button variant="secondary" onClick={() => setEditOpen(true)}>Edit</Button>
                <Button variant="secondary" onClick={onDelete}>Delete</Button>
              </>
            )}
          </div>
        </div>

        {loading && <div className="text-muted">Loading meeting...</div>}
        {!loading && errorMsg && (
          <div style={{ color: '#dc2626', fontSize: 14 }}>
            Error: {errorMsg}{' '}
            <Button variant="secondary" onClick={load} style={{ marginLeft: 6 }}>
              Retry
            </Button>
          </div>
        )}
        {!loading && !errorMsg && !meeting && (
          <div className="text-muted">Meeting not found.</div>
        )}

        {!loading && meeting && (
          <>
            <div style={styles.section}>
              <div>
                <strong>When: </strong>
                {formatDateTime(meeting.start_time)} — {formatDateTime(meeting.end_time)}
              </div>
              {meeting.location && (
                <div>
                  <strong>Location: </strong>
                  {meeting.location}
                </div>
              )}
              {Array.isArray(meeting.attendees) && meeting.attendees.length > 0 && (
                <div>
                  <strong>Attendees: </strong>
                  {meeting.attendees.join(', ')}
                </div>
              )}
              {Array.isArray(meeting.tags) && meeting.tags.length > 0 && (
                <div>
                  <strong>Tags: </strong>
                  {meeting.tags.map((t) => (
                    <span key={t} style={{ ...styles.tag, marginRight: 6 }}>#{t}</span>
                  ))}
                </div>
              )}
              {Array.isArray(meeting.reminders) && meeting.reminders.length > 0 && (
                <div>
                  <strong>Reminders: </strong>
                  {meeting.reminders.join(', ')} minutes before
                </div>
              )}
              {(meeting.source || meeting.external_event_id) && (
                <div>
                  <strong>Source: </strong>
                  {meeting.source || 'N/A'}
                  {googleLink && (
                    <>
                      {' • '}
                      <a
                        href={googleLink}
                        target="_blank"
                        rel="noreferrer"
                        className="link"
                        style={styles.link}
                        aria-label="Open in Google Calendar"
                      >
                        Open in Google Calendar ↗
                      </a>
                    </>
                  )}
                </div>
              )}
              <div style={styles.divider} />
              {meeting.description && (
                <div>
                  <strong>Description</strong>
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                    {meeting.description}
                  </div>
                </div>
              )}
              {meeting.notes && (
                <div>
                  <strong>Notes</strong>
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                    {meeting.notes}
                  </div>
                </div>
              )}
              <div className="text-muted" style={styles.meta}>
                Created: {formatDateTime(meeting.created_at)} • Updated: {formatDateTime(meeting.updated_at)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit meeting"
        footer={null}
      >
        {meeting ? (
          <MeetingForm
            mode="edit"
            initialValues={meeting}
            onSuccess={(saved) => {
              // optimistic already updated; ensure local meeting reflects latest and refresh
              setMeeting(saved || meeting);
              onEditSuccess();
            }}
            onCancel={() => setEditOpen(false)}
            onOptimisticEdit={(temp) => {
              // instantly reflect edits in this view
              setMeeting((prev) => ({ ...(prev || {}), ...(temp || {}) }));
            }}
            onOptimisticRevert={(prevItem) => {
              // revert meeting view
              if (prevItem?.id) setMeeting(prevItem);
            }}
          />
        ) : (
          <div className="text-muted">Nothing to edit.</div>
        )}
      </Modal>
    </section>
  );
}
