import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';

/**
 * PUBLIC_INTERFACE
 * AuthContextValue
 * Describes the public interface exposed by the AuthContext.
 *
 * - session: The current Supabase session (or null)
 * - user: The authenticated user object (or null)
 * - loading: Whether the auth state is being initialized/refreshed
 * - signInWithPassword(email, password): Promise<{ data, error }>
 * - signUpWithPassword(email, password, options?): Promise<{ data, error }>
 * - signInWithGoogle(options?): Promise<{ data, error }>
 * - signOut(): Promise<{ error }>
 */
const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  // methods
  signInWithPassword: async () => ({ data: null, error: new Error('not implemented') }),
  signUpWithPassword: async () => ({ data: null, error: new Error('not implemented') }),
  signInWithGoogle: async () => ({ data: null, error: new Error('not implemented') }),
  signOut: async () => ({ error: new Error('not implemented') }),
});

/**
 * PUBLIC_INTERFACE
 * useAuth
 * Hook to access the authentication context within React components.
 */
export function useAuth() {
  /** Returns the current AuthContext value. */
  return useContext(AuthContext);
}

/**
 * PUBLIC_INTERFACE
 * AuthProvider
 * React provider component that manages Supabase authentication state
 * and exposes convenient auth methods to children via context.
 *
 * Environment variables required (must be set in the runtime/build environment):
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 *
 * Google OAuth usage notes:
 * - Ensure "Google" provider is enabled in your Supabase project.
 * - Optionally pass a redirectTo URL via options. If not provided,
 *   it will default to window.location.origin if available.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session and subscribe to auth changes
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setLoading(true);
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          // eslint-disable-next-line no-console
          console.error('[AuthProvider] getSession error:', error);
        }

        if (!isMounted) return;
        setSession(currentSession ?? null);
        setUser(currentSession?.user ?? null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Auth helpers

  // PUBLIC_INTERFACE
  const signInWithPassword = useCallback(async (email, password) => {
    /**
     * Email/password sign in.
     * Returns Supabase's response: { data, error }
     */
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      return result;
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  // PUBLIC_INTERFACE
  const signUpWithPassword = useCallback(async (email, password, options = {}) => {
    /**
     * Email/password sign up.
     * Options may include:
     *  - redirectTo: string (email confirmation redirect)
     *  - data: object (user metadata)
     * Returns Supabase's response: { data, error }
     */
    try {
      // Default redirectTo uses current origin when available
      const redirectTo =
        options.redirectTo ||
        (typeof window !== 'undefined' && window.location?.origin) ||
        undefined;

      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: options.data,
        },
      });
      return result;
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  // PUBLIC_INTERFACE
  const signInWithGoogle = useCallback(async (options = {}) => {
    /**
     * Google OAuth sign in.
     * Options may include:
     *  - redirectTo: string
     *  - scopes: string
     *  - queryParams: Record<string, string>
     * Returns Supabase's response: { data, error }
     */
    try {
      const redirectTo =
        options.redirectTo ||
        (typeof window !== 'undefined' && window.location?.origin) ||
        undefined;

      const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: options.scopes,
          queryParams: options.queryParams,
        },
      });
      return result;
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  // PUBLIC_INTERFACE
  const signOut = useCallback(async () => {
    /**
     * Signs out the current user.
     * Returns: { error }
     */
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err };
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [session, user, loading, signInWithPassword, signUpWithPassword, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
