'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLE_REDIRECT: Record<string, string> = {
  admin: '/dashboard/admin',
  hr: '/dashboard/hr',
  employee: '/dashboard/employee',
  candidate: '/dashboard/candidate',
};

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      setError('Email is required.');
      return;
    }

    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });

      if (authError || !authData.user) {
        setError(authError?.message ?? 'Login failed.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        setError('Could not load your profile. Contact support.');
        return;
      }

      const redirect = ROLE_REDIRECT[profile.role] ?? '/dashboard/candidate';
      router.push(redirect);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-root">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg-mesh auth-bg-mesh--login" />
        <div className="auth-bg-grid" />
      </div>

      <div className="auth-card glass-card">
        <div className="auth-brand">
          <span className="auth-pulse auth-pulse--peach" aria-hidden="true" />
          <span className="s-tag">HRMS</span>
        </div>

        <h1 className="s-h auth-heading">
          Welcome<br />back.
        </h1>
        <p className="auth-sub">Sign in to your workspace</p>

        <form onSubmit={handleLogin} className="auth-form" noValidate>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <button type="submit" className="btn-g auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          No account?{' '}
          <Link href="/signup" className="auth-link">Create one</Link>
        </p>
      </div>
    </main>
  );
}