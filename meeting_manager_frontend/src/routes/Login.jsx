import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, ToastContainer } from '../components/common';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/auth/AuthForm';

/**
 * PUBLIC_INTERFACE
 * Login
 * Email/password and Google OAuth login UI connected to AuthContext.
 *
 * Behavior:
 * - Validates email/password inputs.
 * - Displays error messages from validation or AuthContext.
 * - On success, redirects to the dashboard or to the originally requested route.
 */
export default function Login() {
  const { user, loading, signInWithPassword, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toastRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to dashboard
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
      const { data, error } = await signInWithPassword(form.email.trim(), form.password);
      if (error) {
        showError('Login failed', error.message || 'An error occurred during login.');
        return;
      }
      if (data?.user) {
        showSuccess('Welcome back', 'Signing you in...');
        // Redirect to intended path (from ProtectedRoute) or default to /dashboard
        const redirectTo = location.state?.from?.pathname || '/dashboard';
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      showError('Login failed', err.message || 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        showError('Google sign-in failed', error.message || 'An error occurred.');
      } else {
        // Supabase OAuth will redirect; no further action here
        showSuccess('Redirecting to Google', 'Please complete authentication...');
      }
    } catch (err) {
      showError('Google sign-in failed', err.message || 'Unexpected error');
    }
  };

  return (
    <section aria-labelledby="login-title" style={{ width: '100%' }}>
      <ToastContainer ref={toastRef} />
      <AuthForm
        title="Sign in"
        subtitle="Access your meeting manager"
        onSubmit={onSubmit}
        actions={
          <>
            <Button type="submit" size="lg" disabled={submitting || loading} aria-label="Sign in to your account">
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onGoogle}
              disabled={loading}
              aria-label="Continue with Google"
            >
              Continue with Google
            </Button>
          </>
        }
        footer={
          <>
            Don&apos;t have an account?{' '}
            <Link className="link" to="/signup">Create one</Link>
          </>
        }
      >
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
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Your password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
        />
        {/* Hidden live region for improved screen reader announcement of errors */}
        <span id="login-email-error" style={{ position: 'absolute', left: -9999 }} aria-live="polite">
          {errors.email || ''}
        </span>
        <span id="login-password-error" style={{ position: 'absolute', left: -9999 }} aria-live="polite">
          {errors.password || ''}
        </span>
      </AuthForm>
    </section>
  );
}
