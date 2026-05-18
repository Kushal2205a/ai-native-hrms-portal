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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Login failed.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      setError('Could not load your profile. Contact support.');
      setLoading(false);
      return;
    }

    const redirect = ROLE_REDIRECT[profile.role] ?? '/dashboard/candidate';
    router.push(redirect);
  }

  return (
    <main className="login-root">
      {/* Background */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-mesh" />
        <div className="login-bg-grid" />
      </div>

      {/* Card */}
      <div className="login-card glass-card">
        {/* Brand */}
        <div className="login-brand">
          <span className="login-pulse" aria-hidden="true" />
          <span className="s-tag">HRMS</span>
        </div>

        <h1 className="s-h login-heading">
          Welcome<br />back.
        </h1>
        <p className="login-sub">Sign in to your workspace</p>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="email" className="login-label s-tag">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="you@company.com"
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label s-tag">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-g login-submit"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className="login-footer">
          No account?{' '}
          <Link href="/signup" className="login-link">
            Create one
          </Link>
        </p>
      </div>

      <style>{`
        /* ── Root ── */
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* ── Background ── */
        .login-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .login-bg-mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 40%, #f2a38418 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 70%, #77c3c012 0%, transparent 70%);
        }
        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 64px 64px;
          -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        /* ── Card ── */
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 48px 40px 40px;
          display: flex;
          flex-direction: column;
          gap: 0;
          animation: reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Brand row ── */
        .login-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }
        .login-pulse {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--g);
          animation: breathe 2.4s ease-in-out infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(0.75); opacity: 0.55; }
        }

        /* ── Heading ── */
        .login-heading {
          font-size: clamp(42px, 5vw, 56px);
          color: var(--ink);
          margin: 0 0 8px;
          line-height: 0.96;
        }
        .login-sub {
          font-family: var(--sans);
          font-size: 13px;
          color: var(--muted);
          margin: 0 0 36px;
          font-weight: 300;
        }

        /* ── Form ── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .login-label {
          display: block;
          font-size: 10px;
          color: var(--muted);
        }
        .login-input {
          width: 100%;
          background: var(--dim);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--ink);
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 300;
          padding: 12px 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .login-input::placeholder {
          color: var(--muted);
          opacity: 0.5;
        }
        .login-input:focus {
          border-color: var(--g-glow);
        }
        .login-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Error ── */
        .login-error {
          font-family: var(--sans);
          font-size: 12px;
          color: var(--red);
          margin: 0;
          padding: 10px 12px;
          background: #c94a3a18;
          border: 1px solid #c94a3a33;
          border-radius: 4px;
        }

        /* ── Submit ── */
        .login-submit {
          width: 100%;
          margin-top: 4px;
          font-family: var(--sans);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px #f2a38459;
        }
        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Footer ── */
        .login-footer {
          font-family: var(--sans);
          font-size: 13px;
          color: var(--muted);
          text-align: center;
          margin-top: 24px;
          font-weight: 300;
        }
        .login-link {
          color: var(--g);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .login-link:hover {
          opacity: 0.75;
        }

        @media (max-width: 480px) {
          .login-card { padding: 36px 24px 32px; }
        }
      `}</style>
    </main>
  );
}