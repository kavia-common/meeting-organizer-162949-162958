import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabaseClient';
import { handleAuthError } from '../utils/auth';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // In v2 of supabase-js, session is processed automatically if using detectSessionInUrl
      // but we try to fetch current session to verify
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          handleAuthError(error, navigate);
          return;
        }
        if (data?.session) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (e) {
        handleAuthError(e, navigate);
      }
    };
    handleAuthCallback();
  }, [navigate]);

  return <div>Processing authentication...</div>;
}
