import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createMeeting, updateMeeting } from '../../services/meetingsService';
import { Button, Input, ToastContainer } from '../common';

/**
 * PUBLIC_INTERFACE
 * MeetingForm
 * A reusable form component for creating and editing meetings.
 *
 * Props:
 * - mode?: 'create' | 'edit' (default 'create')
 * - initialValues?: Partial<MeetingManager.Meeting | MeetingManager.MeetingInsert>
 *   Provides default values for edit mode, or prefilled values for create mode.
 * - userId?: string
 *   Owner user id; required for create mode. When absent in create mode, submission will be blocked.
 * - onSuccess?: (meeting: MeetingManager.Meeting) => void
 *   Called after a successful create or update with the returned meeting.
 * - onCancel?: () => void
 *   Called when user clicks Cancel.
 * - onError?: (error: Error) => void
 *   Optional hook when an error occurs on submit.
 * - enableService?: boolean (default true)
 *   For future extensibility; currently always uses service.
 *
 * Behavior and UX:
 * - Validates required fields (title, start_time, end_time, user_id on create).
 * - Displays inline field errors and toast notifications for success/error.
 * - On submit, calls meetingsService.createMeeting (create mode) or updateMeeting (edit mode).
 * - Designed to be embedded within a Modal. Shows primary and secondary actions.
 *
 * Accessibility:
 * - Inputs have labels, errors are rendered near fields and announced via Toasts.
 * - Buttons are standard button elements.
 */
export default function MeetingForm({
  mode = 'create',
  initialValues = {},
  userId,
  onSuccess,
  onCancel,
  onError,
  enableService = true,
  // Optimistic UI coordination with parent (Dashboard/Details)
  onOptimisticCreate,
  onOptimisticEdit,
  onOptimisticRevert,
}) {
  const isEdit = mode === 'edit';

  // Build default form state
  const defaults = useMemo(() => {
    const now = new Date();
    const isoStart = toLocalISOString(roundToNext15Min(now));
    const isoEnd = toLocalISOString(addMinutes(roundToNext15Min(now), 30));
    return {
      title: '',
      description: '',
      location: '',
      start_time: isoStart,
      end_time: isoEnd,
      attendees: '',
      tags: '',
      reminders: '',
      ...mapInitialValues(initialValues),
    };
  }, [initialValues]);

  const [form, setForm] = useState(defaults);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toastRef = useRef(null);

  // Keep form in sync if initialValues change
  useEffect(() => {
    setForm(defaults);
    setErrors({});
  }, [defaults]);

  // Helpers for feedback
  const showError = (title, description) => {
    toastRef.current?.show({ title, description, type: 'error' });
  };
  const showSuccess = (title, description) => {
    toastRef.current?.show({ title, description, type: 'success' });
  };

  // Handle basic text changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validation
  const validate = () => {
    const next = {};
    if (!form.title?.trim()) {
      next.title = 'Title is required';
    }
    if (!form.start_time) {
      next.start_time = 'Start time is required';
    }
    if (!form.end_time) {
      next.end_time = 'End time is required';
    }
    // Time ordering check
    if (form.start_time && form.end_time) {
      const st = new Date(form.start_time);
      const et = new Date(form.end_time);
      if (isFinite(st.getTime()) && isFinite(et.getTime()) && et <= st) {
        next.end_time = 'End time must be after start time';
      }
    }
    // For create mode ensure userId exists
    if (!isEdit && !userId) {
      next.user_id = 'User ID is required to create a meeting';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Parse string lists to arrays with trimming and filtering
  const parseList = (text) => {
    if (!text || typeof text !== 'string') return [];
    return text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Parse reminders (numbers)
  const parseReminders = (text) => {
    const arr = parseList(text);
    const nums = arr
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n >= 0);
    return nums;
  };

  // Normalize payload for service calls (create/update)
  const buildPayload = () => {
    const p = {
      title: form.title?.trim(),
      description: form.description?.trim() || null,
      location: form.location?.trim() || null,
      start_time: toISOStringSafe(form.start_time),
      end_time: toISOStringSafe(form.end_time),
      attendees: parseList(form.attendees),
      tags: parseList(form.tags),
      reminders: parseReminders(form.reminders),
    };
    if (!isEdit) {
      // create needs user_id provided from props
      p.user_id = userId;
    }
    return p;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError('Validation failed', 'Please correct the highlighted fields.');
      return;
    }

    if (!enableService) {
      const mock = buildMockResult(form, isEdit);
      // optimistic for mock
      if (isEdit) {
        onOptimisticEdit?.(mock);
      } else {
        onOptimisticCreate?.(mock);
      }
      showSuccess(isEdit ? 'Updated (mock)' : 'Created (mock)', 'Service disabled for this environment.');
      onSuccess?.(mock);
      return;
    }

    setSubmitting(true);

    // Build optimistic item
    const optimisticItem = buildMockResult(form, isEdit);
    const prevForRevert = isEdit ? initialValues : optimisticItem;

    // Fire optimistic callback
    if (isEdit) onOptimisticEdit?.(optimisticItem);
    else onOptimisticCreate?.(optimisticItem);

    try {
      if (isEdit) {
        const id = initialValues?.id;
        if (!id) throw new Error('Missing meeting id for edit operation.');
        const payload = buildPayload();
        const { data, error } = await updateMeeting(id, payload);
        if (error) throw error;
        showSuccess('Meeting updated', 'Your changes have been saved.');
        onSuccess?.(data);
      } else {
        const payload = buildPayload();
        const { data, error } = await createMeeting(payload);
        if (error) throw error;
        showSuccess('Meeting created', 'Your meeting was added.');
        onSuccess?.(data);
      }
    } catch (err) {
      const msg = err?.message || 'An error occurred while saving the meeting.';
      // revert optimistic change
      try {
        onOptimisticRevert?.(prevForRevert, isEdit ? 'edit' : 'create');
      } catch {
        // no-op
      }
      // Show consistent, user-friendly toast without altering layout
      showError(isEdit ? 'Update failed' : 'Create failed', msg);
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Styles consistent with existing components
  const styles = {
    form: {
      display: 'grid',
      gap: 10,
    },
    row2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
    },
    row3: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 10,
    },
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 4,
    },
    hint: {
      fontSize: 12,
      color: 'var(--muted)',
    },
    textArea: {
      width: '100%',
      minHeight: 80,
      padding: '10px 12px',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${errors.description ? '#ef4444' : 'var(--border-color)'}`,
      background: 'var(--surface)',
      color: 'var(--text-primary)',
      outline: 'none',
      fontSize: 14,
      boxSizing: 'border-box',
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-secondary)',
      marginBottom: 6,
      display: 'inline-block',
    },
    errorText: {
      fontSize: 12,
      color: '#ef4444',
      minHeight: 18,
    },
  };

  return (
    <section aria-label={isEdit ? 'Edit meeting' : 'Create meeting'}>
      <ToastContainer ref={toastRef} />
      <form onSubmit={onSubmit} style={styles.form} noValidate>
        <Input
          label="Title"
          name="title"
          placeholder="e.g., Sprint Planning"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          required
        />

        <div style={styles.row2}>
          <Input
            label="Start time"
            name="start_time"
            type="datetime-local"
            value={toInputLocalValue(form.start_time)}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, start_time: v }));
              if (errors.start_time) {
                setErrors((prev) => ({ ...prev, start_time: undefined }));
              }
            }}
            error={errors.start_time}
            required
          />
          <Input
            label="End time"
            name="end_time"
            type="datetime-local"
            value={toInputLocalValue(form.end_time)}
            onChange={(e) => {
              const v = e.target.value;
              setForm((prev) => ({ ...prev, end_time: v }));
              if (errors.end_time) {
                setErrors((prev) => ({ ...prev, end_time: undefined }));
              }
            }}
            error={errors.end_time}
            required
          />
        </div>

        <Input
          label="Location"
          name="location"
          placeholder="e.g., Zoom, Room A, or Address"
          value={form.location ?? ''}
          onChange={handleChange}
        />

        <div>
          <label style={styles.label} htmlFor="mf-description">Description</label>
          <textarea
            id="mf-description"
            name="description"
            placeholder="Add agenda or details..."
            style={styles.textArea}
            value={form.description ?? ''}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, description: e.target.value }));
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
          />
          <div style={styles.errorText}>
            {typeof errors.description === 'string' ? errors.description : ''}
          </div>
        </div>

        <div style={styles.row3}>
          <Input
            label="Attendees (comma-separated emails)"
            name="attendees"
            placeholder="alice@example.com, bob@example.com"
            value={form.attendees}
            onChange={handleChange}
          />
          <Input
            label="Tags (comma-separated)"
            name="tags"
            placeholder="planning, client, quarterly"
            value={form.tags}
            onChange={handleChange}
          />
          <Input
            label="Reminders (minutes, comma-separated)"
            name="reminders"
            placeholder="5, 15, 60"
            value={form.reminders}
            onChange={handleChange}
          />
        </div>
        {!isEdit && (
          <div style={styles.hint}>
            Note: Creating a meeting requires a valid authenticated user. Ensure you are signed in.
            {errors.user_id && <div style={styles.errorText}>{errors.user_id}</div>}
          </div>
        )}

        <div style={styles.actions}>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save changes' : 'Create meeting'}
          </Button>
        </div>
      </form>
    </section>
  );
}

/**
 * Utility: Map initialValues (Meeting or partial) into local form representation.
 * Converts arrays to comma-separated strings for attendees/tags/reminders.
 */
function mapInitialValues(v = {}) {
  const out = { ...v };
  // Convert arrays to text inputs
  if (Array.isArray(v.attendees)) {
    out.attendees = v.attendees.join(', ');
  }
  if (Array.isArray(v.tags)) {
    out.tags = v.tags.join(', ');
  }
  if (Array.isArray(v.reminders)) {
    out.reminders = v.reminders.join(', ');
  }
  // Ensure times are in a safe string format for datetime-local input
  if (v.start_time) {
    out.start_time = toLocalISOString(new Date(v.start_time));
  }
  if (v.end_time) {
    out.end_time = toLocalISOString(new Date(v.end_time));
  }
  return out;
}

/**
 * Returns ISO-like string in local timezone suitable for storing/normalizing.
 * If the input is already a string from datetime-local (without timezone), return as-is.
 */
function toISOStringSafe(v) {
  // datetime-local typically returns 'YYYY-MM-DDTHH:mm'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
    // Convert to actual ISO with timezone by constructing a Date
    const d = new Date(v);
    if (isNaN(d.getTime())) {
      // fallback: return original string (backend may handle)
      return v;
    }
    return d.toISOString();
  }
  try {
    const d = new Date(v);
    return d.toISOString();
  } catch {
    return v;
  }
}

/**
 * Convert Date to local "YYYY-MM-DDTHH:mm" string suitable for input[type=datetime-local] value.
 */
function toLocalISOString(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

/**
 * Transform currently stored value to an appropriate input value.
 * Accepts Date or string and returns "YYYY-MM-DDTHH:mm".
 */
function toInputLocalValue(v) {
  if (!v) return '';
  if (v instanceof Date) return toLocalISOString(v);
  // if it already looks like "YYYY-MM-DDTHH:mm", return as is
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return v.slice(0, 16);
  // otherwise try to parse as date string/ISO
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  return toLocalISOString(d);
}

function addMinutes(date, mins) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + mins);
  return d;
}

function roundToNext15Min(d) {
  const date = new Date(d);
  const minutes = date.getMinutes();
  const next = Math.ceil(minutes / 15) * 15;
  date.setMinutes(next, 0, 0);
  return date;
}

function buildMockResult(form, isEdit) {
  const nowIso = new Date().toISOString();
  const base = {
    id: form.id || `mock-${Date.now()}`,
    user_id: 'mock-user',
    title: form.title,
    description: form.description || null,
    location: form.location || null,
    start_time: toISOStringSafe(form.start_time),
    end_time: toISOStringSafe(form.end_time),
    attendees: (form.attendees || '').split(',').map((s) => s.trim()).filter(Boolean),
    notes: null,
    tags: (form.tags || '').split(',').map((s) => s.trim()).filter(Boolean),
    reminders: (form.reminders || '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0),
    source: 'manual',
    external_event_id: null,
    created_at: nowIso,
    updated_at: nowIso,
  };
  return base;
}
