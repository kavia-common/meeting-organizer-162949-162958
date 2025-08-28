import supabase from '../lib/supabaseClient';
import { getURL } from './getURL';

export const handleAuthError = (error, navigate) => {
  if (!error) return;
  // eslint-disable-next-line no-console
  console.error('Authentication error:', error);
  const message = error?.message || '';
  if (message.includes('redirect')) {
    navigate?.('/auth/error?type=redirect');
  } else if (message.includes('email')) {
    navigate?.('/auth/error?type=email');
  } else {
    navigate?.('/auth/error');
  }
};

export const signUp = async (email, password) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getURL()}auth/callback`,
    },
  });
};

export const resetPassword = async (email) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getURL()}auth/reset-password`,
  });
};

export const signInWithMagicLink = async (email) => {
  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getURL()}auth/callback`,
    },
  });
};

export const signInWithOAuth = async (provider) => {
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getURL()}auth/callback`,
    },
  });
};
