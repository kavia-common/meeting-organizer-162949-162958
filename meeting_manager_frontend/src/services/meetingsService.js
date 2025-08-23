import { supabase } from '../lib/supabaseClient';

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

  let query = supabase
    .from('meetings')
    .select('*', { count: 'exact' });

  // Filter by owner
  if (userId) {
    query = query.eq('user_id', userId);
  }

  // Date range filters
  if (from) {
    query = query.gte('start_time', from);
  }
  if (to) {
    query = query.lte('start_time', to);
  }

  // Tags filters
  // tagsAny: overlap (&&) operator matches any tags
  if (Array.isArray(tagsAny) && tagsAny.length > 0) {
    query = query.overlaps('tags', tagsAny);
  }
  // tagsAll: contains (@>) operator matches all tags
  if (Array.isArray(tagsAll) && tagsAll.length > 0) {
    query = query.contains('tags', tagsAll);
  }

  // Full-text like search across common textual fields
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    // Use or() to apply ilike across multiple columns.
    // Note: or() requires a single string with comma-separated conditions wrapped in '()'
    query = query.or(
      `title.ilike.${term},description.ilike.${term},location.ilike.${term},notes.ilike.${term}`
    );
  }

  // Ordering, pagination
  query = query
    .order(orderBy, { ascending: orderDir !== 'desc' })
    .range(offset, offset + limit - 1);

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
    return { data, count: count ?? null, error };
  } catch (err) {
    return { data: null, count: null, error: err };
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
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
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
    // Ensure default arrays if not provided
    const body = {
      attendees: [],
      tags: [],
      reminders: [],
      ...payload,
    };
    const { data, error } = await supabase
      .from('meetings')
      .insert([body])
      .select('*')
      .single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
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
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
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
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}
