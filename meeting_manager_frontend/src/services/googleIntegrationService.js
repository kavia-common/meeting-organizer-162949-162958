import supabase from '../lib/supabaseClient';

/**
 * PUBLIC_INTERFACE
 * GoogleIntegrationService
 * Utilities to fetch Google Calendar events using the current Supabase session's OAuth token,
 * parse them into MeetingManager.Meeting-like objects and assist with duplicate detection.
 *
 * Requirements:
 * - User must connect Google via Supabase OAuth (Google provider).
 * - The session must include Google access token with appropriate scopes:
 *   https://www.googleapis.com/auth/calendar.readonly or
 *   https://www.googleapis.com/auth/calendar.events.readonly
 *
 * Environment:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * Usage example:
 *  import { fetchGoogleEvents, toMeetingObjects, mergeWithoutDuplicates } from './googleIntegrationService';
 *
 *  const { accessToken, error: tokenErr } = await getGoogleAccessToken();
 *  if (accessToken) {
 *    const { events, error } = await fetchGoogleEvents({ accessToken, timeMin, timeMax });
 *    const meetings = toMeetingObjects(events, currentUserId);
 *    // Optionally, merge against existing meetings to avoid duplicates by external_event_id
 *    const merged = mergeWithoutDuplicates(existingMeetings, meetings);
 *  }
 */

/**
 * PUBLIC_INTERFACE
 * getGoogleAccessToken
 * Attempts to read the Google OAuth access token for the current session.
 * Returns { accessToken: string | null, error: Error | null }.
 * Note: Depending on Supabase and provider configuration, provider tokens can be found on:
 * - session.provider_token (v2 client sometimes populates these)
 * - session.user.identities[n].identity_data?.access_token
 * - session.provider_refresh_token (not used directly here)
 */
export async function getGoogleAccessToken() {
  /**
   * Attempts to read a Google OAuth access token from the current Supabase session.
   * Tries several locations due to differences across Supabase versions/configurations.
   */
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { accessToken: null, error };

    const session = data?.session || null;
    if (!session) {
      return { accessToken: null, error: new Error('No active session') };
    }

    // 1) Direct provider token on session (most common)
    if (session.provider_token) {
      return { accessToken: session.provider_token, error: null };
    }

    // 2) Sometimes access token is in user metadata
    const metaCandidates = [
      session.user?.user_metadata?.provider_token,
      session.user?.user_metadata?.access_token,
      session.user?.app_metadata?.provider_token,
    ].filter(Boolean);
    if (metaCandidates.length > 0) {
      return { accessToken: metaCandidates[0], error: null };
    }

    // 3) Check identities array
    const identities = Array.isArray(session.user?.identities) ? session.user.identities : [];
    const googleIdentity = identities.find((i) => i?.provider === 'google');
    const identityData = googleIdentity?.identity_data || googleIdentity?.identityData || {};
    const identityTokenCandidates = [
      identityData.access_token,
      identityData.provider_token,
      identityData.oauth_access_token,
      identityData.token,
    ].filter((v) => typeof v === 'string' && v.length > 0);

    if (identityTokenCandidates.length > 0) {
      return { accessToken: identityTokenCandidates[0], error: null };
    }

    return {
      accessToken: null,
      error: new Error(
        'Google access token not found on session. Please reconnect Google from Settings to grant calendar access.'
      ),
    };
  } catch (err) {
    return { accessToken: null, error: err };
  }
}

/**
 * PUBLIC_INTERFACE
 * fetchGoogleEvents
 * Fetches Google Calendar events within a time range using the provided OAuth access token.
 *
 * Parameters:
 * - accessToken: string (required) - Google OAuth access token
 * - timeMin: string (ISO datetime) - Defaults to now in UTC if not provided
 * - timeMax: string (ISO datetime) - Optional upper bound, defaults to +30 days
 * - maxResults?: number - Defaults to 250
 * - singleEvents?: boolean - Defaults true; expand recurring events into instances
 * - orderBy?: 'startTime' | 'updated' - Defaults 'startTime'
 * - calendarId?: string - Defaults 'primary'
 *
 * Returns: Promise<{ events: any[] | null, error: Error | null }>
 *
 * Notes:
 * - Uses Google Calendar v3: GET /calendar/v3/calendars/{calendarId}/events
 * - Requires appropriate scopes on the access token.
 */
export async function fetchGoogleEvents({
  accessToken,
  timeMin,
  timeMax,
  maxResults = 250,
  singleEvents = true,
  orderBy = 'startTime',
  calendarId = 'primary',
} = {}) {
  if (!accessToken) {
    return { events: null, error: new Error('Missing access token') };
  }

  try {
    const now = new Date();
    const defaultMin = now.toISOString();
    const defaultMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams({
      timeMin: timeMin || defaultMin,
      timeMax: timeMax || defaultMax,
      maxResults: String(maxResults),
      singleEvents: String(!!singleEvents),
      orderBy: orderBy || 'startTime',
    });

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Explicitly request JSON in case some environments require it
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Common case: 403 insufficient permissions when scopes are missing
      const enhanced = text && text.includes('insufficientPermissions')
        ? 'Insufficient permissions. Please reconnect Google and grant calendar read permissions.'
        : '';
      throw new Error(`Google API error (${res.status}): ${text || res.statusText}${enhanced ? ` - ${enhanced}` : ''}`);
    }

    const json = await res.json();
    const items = Array.isArray(json?.items) ? json.items : [];
    return { events: items, error: null };
  } catch (err) {
    return { events: null, error: err };
  }
}

/**
 * PUBLIC_INTERFACE
 * toMeetingObjects
 * Maps Google Calendar events to MeetingManager.Meeting-like objects for storage/import.
 * These objects are shaped for the 'meetings' table, with:
 * - source: 'google'
 * - external_event_id: the Google event id
 * - attendees: list of attendee emails (when available)
 * - start_time/end_time: ISO strings
 *
 * Parameters:
 * - events: any[] - raw Google events
 * - userId: string - owner user id in our system
 *
 * Returns: MeetingManager.MeetingInsert[] (without id/created_at/updated_at which will be DB-managed)
 */
export function toMeetingObjects(events = [], userId) {
  if (!Array.isArray(events)) return [];

  return events
    .filter((ev) => ev && typeof ev === 'object')
    .map((ev) => {
      const startIso = extractEventDateTime(ev?.start);
      const endIso = extractEventDateTime(ev?.end);

      const attendees = Array.isArray(ev?.attendees)
        ? ev.attendees
            .map((a) => a?.email)
            .filter((e) => typeof e === 'string' && e.length > 0)
        : [];

      const tags = ['synced', 'external', 'google'];

      return {
        user_id: userId,
        title: ev?.summary || 'Untitled event',
        description: ev?.description || null,
        location: ev?.location || null,
        start_time: startIso,
        end_time: endIso,
        attendees,
        notes: null,
        tags,
        reminders: [], // Google reminders not mapped here; can be extended if needed
        source: 'google',
        external_event_id: ev?.id || null,
      };
    })
    // Filter out invalid times
    .filter((m) => isValidISO(m.start_time) && isValidISO(m.end_time));
}

/**
 * PUBLIC_INTERFACE
 * mergeWithoutDuplicates
 * Merges new meetings into existing ones avoiding duplicates by external_event_id (Google id).
 * If an item in 'incoming' has an external_event_id that already exists in 'existing',
 * it will be skipped. Returns a new array.
 *
 * @param {MeetingManager.Meeting[]} existing
 * @param {MeetingManager.MeetingInsert[]} incoming
 * @returns {Array<MeetingManager.Meeting | MeetingManager.MeetingInsert>}
 */
export function mergeWithoutDuplicates(existing = [], incoming = []) {
  const existingIds = new Set(
    existing
      .map((m) => m?.external_event_id)
      .filter((id) => typeof id === 'string' && id.length > 0)
  );

  const dedupedIncoming = incoming.filter((m) => {
    const id = m?.external_event_id;
    return !(id && existingIds.has(id));
  });

  return [...existing, ...dedupedIncoming];
}

/**
 * PRIVATE: extract start/end time ISO string from Google event date/dateTime objects.
 * Handles all-day events (date) by creating ISO at 00:00:00 for start and 23:59:59 for end when needed.
 */
function extractEventDateTime(obj) {
  if (!obj) return null;

  // If dateTime is available, prefer it
  if (obj.dateTime) {
    const d = new Date(obj.dateTime);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // All-day events may have 'date' (YYYY-MM-DD)
  if (obj.date) {
    try {
      // Google all-day end date is exclusive; we keep start at 00:00 and end at 23:59:59 local for single-day.
      // Here we simply use start-of-day ISO for start; for end we rely on Google-provided end date separately.
      const d = new Date(obj.date + 'T00:00:00');
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * PRIVATE: Check if a value can be parsed into a valid ISO date string.
 */
function isValidISO(v) {
  try {
    const d = new Date(v);
    return !isNaN(d.getTime());
  } catch {
    return false;
  }
}

/**
 * PUBLIC_INTERFACE
 * hasCalendarScope
 * Best-effort detection of whether the current session has Google Calendar read scopes.
 * Since the exact storage of scopes is not guaranteed on the client, this is heuristic.
 */
export async function hasCalendarScope() {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session || null;
    if (!session) return false;

    // Some setups include granted scopes in user_metadata or app_metadata
    const scopeSources = [
      session.user?.user_metadata?.scopes,
      session.user?.app_metadata?.scopes,
      session.user?.identities?.find?.((i) => i?.provider === 'google')?.identity_data?.scopes,
    ].filter(Boolean);

    const allScopes = (scopeSources.join?.(' ') || (Array.isArray(scopeSources) ? scopeSources.join(' ') : '')).toString();

    return (
      typeof allScopes === 'string' &&
      (allScopes.includes('https://www.googleapis.com/auth/calendar.readonly') ||
        allScopes.includes('https://www.googleapis.com/auth/calendar.events.readonly'))
    );
  } catch {
    return false;
  }
}
