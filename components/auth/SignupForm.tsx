'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedFullName = fullName.trim();
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedFullName) {
      setError('Full name is required.');
      return;
    }

    if (!cleanedEmail) {
      setError('Email is required.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setLoading(true);

      const { error: signupError } = await supabase.auth.signUp({
        email: cleanedEmail,
        password,
        options: {
          data: { full_name: cleanedFullName },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      // All new signups are candidates — trigger sets role automatically
      router.push('/dashboard/candidate');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-root">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-mesh auth-bg-mesh--signup" />
        <div className="auth-bg-grid" />
      </div>

      <div className="auth-card glass-card">
        <div className="auth-brand">
          <span className="auth-pulse auth-pulse--teal" aria-hidden="true" />
          <span className="s-tag">HRMS</span>
        </div>

        <h1 className="s-h auth-heading">
          Create your<br />account.
        </h1>

        <p className="auth-notice">
          All new accounts start as candidate profiles.
        </p>

        <form onSubmit={handleSignup} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="full-name" className="auth-label s-tag">Full Name</label>
            <input
              id="full-name"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="auth-input"
              placeholder="Ada Lovelace"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email" className="auth-label s-tag">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@company.com"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label s-tag">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Min. 8 characters"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirm" className="auth-label s-tag">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <button type="submit" className="btn-g auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider" aria-hidden="true">
          <span />
          <p className="s-tag">or</p>
          <span />
        </div>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </main>
  );
}