import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, ToastContainer } from '../components/common';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * Signup
 * Email/password signup UI connected to AuthContext with Google OAuth option.
 *
 * Behavior:
 * - Validates inputs, shows inline errors.
 * - On successful signup, if user is created and session exists, redirect to dashboard.
 * - If email confirmation is required by Supabase, show a toast informing the user to verify email.
 */
export default function Signup() {
  const { user, loading, signUpWithPassword, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toastRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const validate = () => {
    const next = {};
    if (!form.email?.trim()) {
      next.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email';
    }
    if (!form.password) {
      next.password = 'Password is required';
    } else if (form.password.length < 6) {
      next.password = 'Minimum 6 characters';
    }
    if (!form.confirm) {
      next.confirm = 'Please confirm your password';
    } else if (form.password !== form.confirm) {
      next.confirm = 'Passwords do not match';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const showError = (title, description) => {
    toastRef.current?.show({ title, description, type: 'error' });
  };

  const showSuccess = (title, description) => {
    toastRef.current?.show({ title, description, type: 'success' });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data, error } = await signUpWithPassword(form.email.trim(), form.password);
      if (error) {
        showError('Signup failed', error.message || 'An error occurred during signup.');
        return;
      }

      // Supabase may either create a session or require email confirmation
      if (data?.user && data?.session) {
        showSuccess('Account created', 'Redirecting to your dashboard...');
        const redirectTo = location.state?.from?.pathname || '/dashboard';
        navigate(redirectTo, { replace: true });
      } else if (data?.user && !data?.session) {
        // Email confirmation required
        showSuccess('Verify your email', 'We sent you a confirmation link. Please verify to sign in.');
      }
    } catch (err) {
      showError('Signup failed', err.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        showError('Google sign-up failed', error.message || 'An error occurred.');
      } else {
        showSuccess('Redirecting to Google', 'Please complete authentication...');
      }
    } catch (err) {
      showError('Google sign-up failed', err.message || 'Unexpected error');
    }
  };

  const styles = {
    card: {
      background: 'var(--surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 20,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      maxWidth: 420,
      margin: '0 auto',
      width: '100%',
    },
    header: {
      marginBottom: 16,
      textAlign: 'center',
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginTop: 10,
    },
    divider: {
      textAlign: 'center',
      color: 'var(--muted)',
      fontSize: 12,
      margin: '8px 0',
    },
    footer: {
      textAlign: 'center',
      marginTop: 12,
      fontSize: 14,
    },
    formGrid: {
      display: 'grid',
      gap: 10,
    },
    title: { margin: 0 },
    subtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 },
  };

  return (
    <section aria-labelledby="signup-title" style={{ width: '100%' }}>
      <ToastContainer ref={toastRef} />
      <div style={styles.card}>
        <header style={styles.header}>
          <h1 id="signup-title" style={styles.title}>Create account</h1>
          <p style={styles.subtitle}>Start managing your meetings</p>
        </header>

        <form onSubmit={onSubmit} style={styles.formGrid} noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm password"
            name="confirm"
            type="password"
            placeholder="Repeat your password"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
            autoComplete="new-password"
            required
          />
          <div style={styles.actions}>
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? 'Creating account...' : 'Sign up'}
            </Button>
            <div style={styles.divider}>or</div>
            <Button type="button" variant="secondary" onClick={onGoogle} disabled={loading}>
              Continue with Google
            </Button>
          </div>
        </form>

        <div style={styles.footer}>
          Already have an account?{' '}
          <Link className="link" to="/login">Sign in</Link>
        </div>
      </div>
    </section>
  );
}
