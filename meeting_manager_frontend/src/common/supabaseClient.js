import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * supabase (default export)
 * Initializes and exports a singleton Supabase client instance for the frontend app.
 *
 * Configuration:
 * - REACT_APP_SUPABASE_URL: Supabase project URL
 * - REACT_APP_SUPABASE_KEY: Supabase anonymous public key
 *
 * Note:
 * - Do not hardcode configuration. Values must be provided via environment variables.
 * - This client should be the only instance used across the app.
 */
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

// Basic runtime guards to aid debugging misconfiguration in non-production builds.
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] Missing Supabase environment variables. ' +
      'Ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY are set.'
  );
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    // Persist session in local storage by default
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
