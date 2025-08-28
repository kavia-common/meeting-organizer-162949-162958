import supabase from '../common/supabaseClient';

/**
 * PUBLIC_INTERFACE
 * MeetingsService
 * Supabase-powered CRUD operations for the 'meetings' table.
 *
 * Environment:
 * - Requires REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY to be set.
 *
 * Types:
 * - Uses the Meeting types defined in src/types/index.d.ts (namespace MeetingManager).
 */

// Normalize any error coming from Supabase/fetch/unknown into a user-friendly Error with message
function normalizeError(err, fallback = 'Unexpected error') {
  try {
    if (!err) return new Error(fallback);
    // If Supabase error object
    if (typeof err === 'object') {
      const code = err.code || err.status || err.error?.code;
      const msg =
        err.message ||
        err.msg ||
        err.error_description ||
        err.error ||
        err.details ||
        (typeof err.toString === 'function' ? String(err) : null) ||
        fallback;
      const e = new Error(msg);
      if (code) e.code = code;
      return e;
    }
    // Primitive
    return new Error(String(err));
  } catch {
    return new Error(fallback);
  }
}

/**
 * PUBLIC_INTERFACE
 * buildQuery
 * Internal helper to construct a Supabase query with common filters and search.
 * Supported params for listMeetings:
 * - userId?: string            Filter meetings by owner user_id
 * - from?: string              ISO date to include meetings with start_time >= from
 * - to?: string                ISO date to include meetings with start_time <= to
 * - search?: string            Text search across title, description, location, notes
 * - tagsAny?: string[]         Matches if any of the provided tags are present
 * - tagsAll?: string[]         Matches if all of the provided tags are present
 * - limit?: number             Pagination limit (default 50)
 * - offset?: number            Pagination offset (default 0)
 * - orderBy?: string           Column to order by (default 'start_time')
 * - orderDir?: 'asc'|'desc'    Sort direction (default 'asc')
 */
function buildQuery(params = {}) {
  const {
    userId,
    from,
    to,
    search,
    tagsAny,
    tagsAll,
    limit = 50,
    offset = 0,
    orderBy = 'start_time',
    orderDir = 'asc',
  } = params;

  let query = supabase.from('meetings').select('*', { count: 'exact' });

  if (userId) query = query.eq('user_id', userId);
  if (from) query = query.gte('start_time', from);
  if (to) query = query.lte('start_time', to);

  if (Array.isArray(tagsAny) && tagsAny.length > 0) {
    query = query.overlaps('tags', tagsAny);
  }
  if (Array.isArray(tagsAll) && tagsAll.length > 0) {
    query = query.contains('tags', tagsAll);
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `title.ilike.${term},description.ilike.${term},location.ilike.${term},notes.ilike.${term}`
    );
  }

  query = query.order(orderBy, { ascending: orderDir !== 'desc' }).range(offset, offset + limit - 1);

  return query;
}

/**
 * PUBLIC_INTERFACE
 * listMeetings
 * Lists meetings with optional filtering, searching, and pagination.
 *
 * @param {Object} params - filter and pagination parameters
 * @returns {Promise<{ data: MeetingManager.Meeting[] | null, count: number | null, error: Error | null }>}
 */
export async function listMeetings(params = {}) {
  try {
    const query = buildQuery(params);
    const { data, error, count } = await query;
    return { data, count: count ?? null, error: error ? normalizeError(error, 'Failed to load meetings') : null };
  } catch (err) {
    return { data: null, count: null, error: normalizeError(err, 'Failed to load meetings') };
  }
}

/**
 * PUBLIC_INTERFACE
 * getMeeting
 * Fetch a single meeting by id.
 *
 * @param {string} id - Meeting UUID
 * @returns {Promise<{ data: MeetingManager.Meeting | null, error: Error | null }>}
 */
export async function getMeeting(id) {
  try {
    const { data, error } = await supabase.from('meetings').select('*').eq('id', id).single();
    return { data, error: error ? normalizeError(error, 'Failed to load meeting') : null };
  } catch (err) {
    return { data: null, error: normalizeError(err, 'Failed to load meeting') };
  }
}

/**
 * PUBLIC_INTERFACE
 * createMeeting
 * Create a new meeting.
 *
 * @param {MeetingManager.MeetingInsert} payload - fields for the new meeting
 * @returns {Promise<{ data: MeetingManager.Meeting | null, error: Error | null }>}
 */
export async function createMeeting(payload) {
  try {
    const body = {
      // Defaults align with DB defaults; client-side defaults for robustness
      attendees: Array.isArray(payload?.attendees) ? payload.attendees : [],
      tags: Array.isArray(payload?.tags) ? payload.tags : [],
      reminders: Array.isArray(payload?.reminders) ? payload.reminders : [],
      ...payload,
    };
    const { data, error } = await supabase.from('meetings').insert([body]).select('*').single();
    return { data, error: error ? normalizeError(error, 'Failed to create meeting') : null };
  } catch (err) {
    return { data: null, error: normalizeError(err, 'Failed to create meeting') };
  }
}

/**
 * PUBLIC_INTERFACE
 * updateMeeting
 * Update an existing meeting by id.
 *
 * @param {string} id - Meeting UUID
 * @param {MeetingManager.MeetingUpdate} updates - partial update fields
 * @returns {Promise<{ data: MeetingManager.Meeting | null, error: Error | null }>}
 */
export async function updateMeeting(id, updates) {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    return { data, error: error ? normalizeError(error, 'Failed to update meeting') : null };
  } catch (err) {
    return { data: null, error: normalizeError(err, 'Failed to update meeting') };
  }
}

/**
 * PUBLIC_INTERFACE
 * deleteMeeting
 * Delete a meeting by id.
 *
 * @param {string} id - Meeting UUID
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function deleteMeeting(id) {
  try {
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    return { success: !error, error: error ? normalizeError(error, 'Failed to delete meeting') : null };
  } catch (err) {
    return { success: false, error: normalizeError(err, 'Failed to delete meeting') };
  }
}

/**
 * PUBLIC_INTERFACE
 * subscribeToMeetings
 * Subscribes to Supabase Realtime changes on the 'meetings' table and invokes callbacks
 * for insert, update, and delete events. Returns an unsubscribe function to clean up.
 *
 * @param {Object} options
 * @param {{ userId?: string }} [options.filter]
 * @param {(row: MeetingManager.Meeting) => void} [options.onInsert]
 * @param {(row: MeetingManager.Meeting) => void} [options.onUpdate]
 * @param {(row: MeetingManager.Meeting) => void} [options.onDelete]
 * @param {(error: any) => void} [options.onError]
 * @returns {() => void} unsubscribe function
 */
export function subscribeToMeetings(options = {}) {
  const { filter = {}, onInsert, onUpdate, onDelete, onError } = options;

  const channel = supabase.channel('realtime:meetings');

  const matchesFilter = (row) => {
    if (!filter || !filter.userId) return true;
    try {
      return row?.user_id === filter.userId;
    } catch {
      return true;
    }
  };

  channel
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meetings' }, (payload) => {
      try {
        const row = payload?.new;
        if (matchesFilter(row)) onInsert?.(row);
      } catch (e) {
        onError?.(normalizeError(e, 'Realtime insert handler failed'));
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meetings' }, (payload) => {
      try {
        const row = payload?.new;
        if (matchesFilter(row)) onUpdate?.(row);
      } catch (e) {
        onError?.(normalizeError(e, 'Realtime update handler failed'));
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'meetings' }, (payload) => {
      try {
        const row = payload?.old;
        if (matchesFilter(row)) onDelete?.(row);
      } catch (e) {
        onError?.(normalizeError(e, 'Realtime delete handler failed'));
      }
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Realtime channel error for meetings'));
      }
    });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      onError?.(normalizeError(e, 'Failed to remove realtime channel'));
    }
  };
}
