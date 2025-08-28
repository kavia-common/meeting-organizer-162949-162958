import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMeetings } from '../../services/meetingsService';
import { Button, Modal } from '../common';
import { useToast, Skeleton } from '../ui';

/**
 * PUBLIC_INTERFACE
 * CalendarView
 * A brand-themed calendar component that supports month, week, and day views.
 * It fetches and displays meetings, allows navigation, and exposes callbacks.
 *
 * Props:
 * - initialView?: 'month' | 'week' | 'day' (default 'month')
 * - currentDate?: Date (default new Date())
 * - onNavigate?: (newDate: Date) => void   // called when user navigates prev/next/today
 * - onViewChange?: (view: 'month' | 'week' | 'day') => void // called when view changes
 * - onMeetingClick?: (meeting: MeetingManager.Meeting) => void // external click handler
 * - userId?: string // optional filter for meetings owned by a user
 * - enableService?: boolean // if false, uses mock data (default true)
 *
 * Behavior:
 * - Uses meetingsService.listMeetings to load meetings for the visible date range.
 *   If enableService=false or service errors occur, falls back to mock data.
 * - Clicking a meeting opens a modal with quick actions (View, Edit placeholder, Delete placeholder).
 * - Exposes navigation buttons: Today, Prev, Next, and view toggles: Month/Week/Day.
 *
 * Accessibility:
 * - Uses semantic buttons and aria-labels for navigation.
 * - Modal component is accessible.
 */
export default function CalendarView({
  initialView = 'month',
  currentDate = new Date(),
  onNavigate,
  onViewChange,
  onMeetingClick,
  userId,
  enableService = true,
}) {
  const [view, setView] = useState(initialView);
  const [cursorDate, setCursorDate] = useState(startOfDay(currentDate));
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState(null); // meeting selected for modal
  const { toast } = useToast();
  const navigate = useNavigate();

  // Derived visible range based on view and cursor
  const { rangeStart, rangeEnd, title } = useMemo(
    () => getVisibleRange(view, cursorDate),
    [view, cursorDate]
  );

  // Load meetings for range
  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setErrorMsg('');
      try {
        const params = {
          userId,
          from: rangeStart.toISOString(),
          to: rangeEnd.toISOString(),
          orderBy: 'start_time',
          orderDir: 'asc',
          limit: 500,
        };

        if (enableService) {
          const { data, error } = await listMeetings(params);
          if (!ignore) {
            if (error) throw error;
            setMeetings(Array.isArray(data) ? data : []);
          }
        } else {
          // mock mode
          const mock = generateMockMeetings(rangeStart, rangeEnd);
          if (!ignore) setMeetings(mock);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMsg(err?.message || 'Failed to load meetings');
          // Fallback to mock
          const mock = generateMockMeetings(rangeStart, rangeEnd);
          setMeetings(mock);
          toast({
            title: 'Using sample data',
            description: 'Could not reach meetings service, showing mock meetings.',
            variant: 'warning',
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [view, cursorDate, rangeStart, rangeEnd, userId, enableService]);

  // Handlers
  const handleViewChange = (nextView) => {
    setView(nextView);
    onViewChange?.(nextView);
  };

  const goToday = () => {
    const today = startOfDay(new Date());
    setCursorDate(today);
    onNavigate?.(today);
  };

  const goPrev = () => {
    const d = addInterval(cursorDate, view, -1);
    setCursorDate(d);
    onNavigate?.(d);
  };

  const goNext = () => {
    const d = addInterval(cursorDate, view, 1);
    setCursorDate(d);
    onNavigate?.(d);
  };

  const handleMeetingClick = (mtg) => {
    setSelected(mtg);
    onMeetingClick?.(mtg);
  };

  // Renderers for grid
  const cells = useMemo(() => buildCells(view, rangeStart, rangeEnd), [view, rangeStart, rangeEnd]);

  const meetingsByDay = useMemo(() => {
    const map = new Map();
    for (const c of cells) map.set(dateKey(c.date), []);
    for (const m of meetings) {
      const k = dateKey(new Date(m.start_time));
      if (map.has(k)) {
        map.get(k).push(m);
      }
    }
    // Sort within day by start_time
    for (const [k, arr] of map) {
      arr.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      map.set(k, arr);
    }
    return map;
  }, [cells, meetings]);

  // Styles (brand-themed using CSS variables)
  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      color: 'var(--text-primary)',
    },
    toolbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    title: { fontSize: 18, fontWeight: 700 },
    toolbarGroup: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: view === 'day' ? '1fr' : 'repeat(7, 1fr)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'var(--surface)',
    },
    cell: {
      minHeight: view === 'day' ? 440 : view === 'week' ? 360 : 150,
      borderRight: '1px solid var(--border-color)',
      borderBottom: '1px solid var(--border-color)',
      padding: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    cellHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 12,
      color: 'var(--muted)',
      marginBottom: 6,
    },
    cellDateBadge: {
      fontWeight: 700,
      color: 'var(--text-secondary)',
    },
    meetingPill: {
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-secondary)',
      padding: '6px 8px',
      fontSize: 13,
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      cursor: 'pointer',
    },
    meetingDot: {
      width: 8,
      height: 8,
      borderRadius: 8,
      background: 'var(--color-primary)',
      flexShrink: 0,
    },
    legend: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      color: 'var(--muted)',
      fontSize: 12,
    },
    loading: {
      fontSize: 13,
      color: 'var(--muted)',
    },
    headerRow: {
      display: view === 'day' ? 'none' : 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderBottom: 'none',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      overflow: 'hidden',
    },
    headerCell: {
      padding: 8,
      borderRight: '1px solid var(--border-color)',
      fontWeight: 700,
      fontSize: 12,
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
  };

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <section aria-label="Calendar" style={styles.wrapper}>

      <div style={styles.toolbar}>
        <div style={styles.toolbarGroup}>
          <Button onClick={goToday} aria-label="Go to today">Today</Button>
          <Button variant="secondary" onClick={goPrev} aria-label="Previous period">←</Button>
          <Button variant="secondary" onClick={goNext} aria-label="Next period">→</Button>
          <div style={styles.title} aria-live="polite">{title}</div>
          {loading && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Skeleton width={80} height={14} />
              <Skeleton width={50} height={14} />
            </span>
          )}
          {errorMsg && <span style={{ color: '#dc2626', fontSize: 12 }}> {errorMsg} </span>}
        </div>
        <div style={styles.toolbarGroup} role="tablist" aria-label="Calendar view">
          <Button
            variant={view === 'month' ? 'primary' : 'secondary'}
            aria-selected={view === 'month'}
            onClick={() => handleViewChange('month')}
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'primary' : 'secondary'}
            aria-selected={view === 'week'}
            onClick={() => handleViewChange('week')}
          >
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'primary' : 'secondary'}
            aria-selected={view === 'day'}
            onClick={() => handleViewChange('day')}
          >
            Day
          </Button>
        </div>
      </div>

      {/* Header row for weekdays (not used in day view) */}
      {view !== 'day' && (
        <div style={styles.headerRow}>
          {weekdayLabels.map((w, i) => (
            <div key={i} style={{ ...styles.headerCell, borderRight: i === 6 ? 'none' : styles.headerCell.borderRight }}>
              {w}
            </div>
          ))}
        </div>
      )}

      <div style={styles.grid}>
        {cells.map((cell, idx) => {
          const key = dateKey(cell.date);
          const items = meetingsByDay.get(key) || [];

          const isToday = sameDate(cell.date, new Date());
          const dayBadgeStyle = {
            ...styles.cellDateBadge,
            color: isToday ? 'var(--color-primary)' : styles.cellDateBadge.color,
          };

          return (
            <div
              key={idx}
              style={{
                ...styles.cell,
                borderRight:
                  (view === 'day' || ((idx + 1) % 7 !== 0)) ? styles.cell.borderRight : 'none',
                borderBottom:
                  idx < cells.length - (view === 'day' ? 0 : 7) ? styles.cell.borderBottom : 'none',
                background: cell.inCurrentPeriod ? 'var(--surface)' : 'rgba(0,0,0,0.02)',
              }}
            >
              <div style={styles.cellHeader}>
                <span style={dayBadgeStyle}>
                  {cell.date.getDate()}
                </span>
                <span>{isToday ? 'Today' : ''}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loading ? (
                  <>
                    <Skeleton width="85%" height={20} style={{ borderRadius: 'var(--radius-md)' }} />
                    <Skeleton width="70%" height={18} style={{ borderRadius: 'var(--radius-md)' }} />
                  </>
                ) : (
                  <>
                    {items.length === 0 && (
                      <div className="text-muted" style={{ fontSize: 12 }}>No meetings</div>
                    )}
                    {items.map((m) => (
                      <div
                        key={m.id}
                        style={styles.meetingPill}
                        onClick={() => handleMeetingClick(m)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleMeetingClick(m); }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Meeting ${m.title} at ${formatTime(m.start_time)}`}
                      >
                        <span style={styles.meetingDot} />
                        <span style={{ fontWeight: 700 }}>{formatTime(m.start_time)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{m.title}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.legend}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {loading ? (
            <Skeleton width={12} height={12} circle />
          ) : (
            <span style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--color-primary)' }} />
          )}
          Meeting
        </span>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.title : ''}
        footer={
          selected && (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              <Button
                onClick={() => {
                  navigate(`/meetings/${selected.id}`);
                }}
              >
                View
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <div>
              <strong>When: </strong>
              {formatDateTime(selected.start_time)} - {formatDateTime(selected.end_time)}
            </div>
            {selected.location && (
              <div>
                <strong>Location: </strong>
                {selected.location}
              </div>
            )}
            {selected.description && (
              <div>
                <strong>Description: </strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{selected.description}</div>
              </div>
            )}
            {Array.isArray(selected.attendees) && selected.attendees.length > 0 && (
              <div>
                <strong>Attendees: </strong>
                {selected.attendees.join(', ')}
              </div>
            )}
            {Array.isArray(selected.tags) && selected.tags.length > 0 && (
              <div>
                <strong>Tags: </strong>
                {selected.tags.map((t) => (
                  <span key={t} style={{ marginRight: 6, padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  toast({ title: 'Edit not implemented', description: 'This is a UI placeholder.' });
                }}
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  toast({ title: 'Delete not implemented', description: 'This is a UI placeholder.', variant: 'warning' });
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

// Helpers

// PUBLIC_INTERFACE
export function startOfDay(d) {
  /** Returns a new Date at 00:00:00 local time. */
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function addInterval(date, view, amount) {
  const d = new Date(date);
  if (view === 'day') {
    d.setDate(d.getDate() + amount);
  } else if (view === 'week') {
    d.setDate(d.getDate() + amount * 7);
  } else {
    d.setMonth(d.getMonth() + amount);
  }
  return startOfDay(d);
}

function monthStart(d) {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}
function monthEnd(d) {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
function weekStart(d) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun - 6 Sat
  x.setDate(x.getDate() - day);
  return x;
}
function weekEnd(d) {
  const s = weekStart(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

// PUBLIC_INTERFACE
export function getVisibleRange(view, date) {
  /**
   * Returns visible range { rangeStart, rangeEnd, title } for a given view and date.
   */
  if (view === 'day') {
    const s = startOfDay(date);
    const e = endOfDay(date);
    return { rangeStart: s, rangeEnd: e, title: formatHeaderDay(s) };
  }
  if (view === 'week') {
    const s = weekStart(date);
    const e = weekEnd(date);
    return { rangeStart: s, rangeEnd: e, title: `${formatHeaderDay(s)} — ${formatHeaderDay(e)}` };
  }
  // month
  const s = monthStart(date);
  const e = monthEnd(date);
  const title = `${s.toLocaleString(undefined, { month: 'long' })} ${s.getFullYear()}`;
  return { rangeStart: s, rangeEnd: e, title };
}

function buildCells(view, s, e) {
  const cells = [];
  if (view === 'day') {
    cells.push({ date: new Date(s), inCurrentPeriod: true });
    return cells;
  }
  if (view === 'week') {
    const cur = new Date(s);
    while (cur <= e) {
      cells.push({ date: new Date(cur), inCurrentPeriod: true });
      cur.setDate(cur.getDate() + 1);
    }
    return cells;
  }
  // month grid includes leading/trailing days to fill complete weeks (Sun-Sat)
  const monthS = monthStart(s);
  const monthE = monthEnd(s);
  const gridS = weekStart(monthS);
  const gridE = weekEnd(monthE);
  const cur = new Date(gridS);
  while (cur <= gridE) {
    cells.push({
      date: new Date(cur),
      inCurrentPeriod: cur.getMonth() === s.getMonth(),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

function pad2(n) {
  return n.toString().padStart(2, '0');
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return iso;
  }
}

function formatHeaderDay(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Mock generator used when service fails or disabled
function generateMockMeetings(rangeStart, rangeEnd) {
  const out = [];
  const days = Math.max(1, Math.round((endOfDay(rangeEnd) - startOfDay(rangeStart)) / (1000 * 60 * 60 * 24)));
  const titles = ['Planning', 'Standup', 'Retro', '1:1', 'Client Call', 'Demo', 'Workshop'];
  for (let i = 0; i <= days; i++) {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);

    // sprinkle a couple meetings on some days
    if (d.getDay() % 2 === 0) {
      const start1 = new Date(d); start1.setHours(9, 0, 0, 0);
      const end1 = new Date(d); end1.setHours(9, 45, 0, 0);
      out.push({
        id: `mock-${d.getTime()}-1`,
        user_id: 'mock-user',
        title: titles[(i + 1) % titles.length],
        description: 'This is a sample meeting for demo purposes.',
        location: 'Online',
        start_time: start1.toISOString(),
        end_time: end1.toISOString(),
        attendees: ['you@example.com'],
        notes: null,
        tags: ['demo'],
        reminders: [15],
        source: 'manual',
        external_event_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      const start2 = new Date(d); start2.setHours(14, 30, 0, 0);
      const end2 = new Date(d); end2.setHours(15, 0, 0, 0);
      out.push({
        id: `mock-${d.getTime()}-2`,
        user_id: 'mock-user',
        title: titles[(i + 3) % titles.length],
        description: 'Follow-up discussion.',
        location: 'Room A',
        start_time: start2.toISOString(),
        end_time: end2.toISOString(),
        attendees: ['you@example.com', 'teammate@example.com'],
        notes: null,
        tags: ['internal'],
        reminders: [5],
        source: 'manual',
        external_event_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }
  return out;
}
