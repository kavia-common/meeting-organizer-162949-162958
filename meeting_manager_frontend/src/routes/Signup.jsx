import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/common';
import { useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/auth/AuthForm';

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
  const { toast } = useToast();
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
    toast({ title, description, variant: 'destructive' });
  };

  const showSuccess = (title, description) => {
    toast({ title, description, variant: 'success' });
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

  return (
    <section aria-labelledby="signup-title" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <AuthForm
        title="Create account"
        subtitle="Set up your profile to schedule and organize meetings seamlessly."
        onSubmit={onSubmit}
        actions={
          <>
            <Button type="submit" size="lg" disabled={submitting || loading} aria-label="Create your account">
              {submitting ? 'Creating account...' : 'Sign up'}
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
            <span className="text-muted">Already have an account?</span>{' '}
            <Link className="link" to="/login"><strong>Sign in</strong></Link>
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
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          helperText="We’ll send a confirmation if required."
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
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'signup-password-error' : undefined}
          helperText="Minimum 6 characters."
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
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? 'signup-confirm-error' : undefined}
          helperText="Make sure it matches the password above."
        />
        {/* Hidden live region for improved screen reader announcement of errors */}
        <span id="signup-email-error" style={{ position: 'absolute', left: -9999 }} aria-live="polite">
          {errors.email || ''}
        </span>
        <span id="signup-password-error" style={{ position: 'absolute', left: -9999 }} aria-live="polite">
          {errors.password || ''}
        </span>
        <span id="signup-confirm-error" style={{ position: 'absolute', left: -9999 }} aria-live="polite">
          {errors.confirm || ''}
        </span>
      </AuthForm>
    </section>
  );
}
