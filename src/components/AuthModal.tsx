'use client';

import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from '@/lib/supabase';
import { useCalculatorStore } from '@/lib/store';

// Check if Supabase is properly configured
const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get the correct site URL for redirects
function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_URL && process.env.NEXT_PUBLIC_URL !== 'http://localhost:3000') {
    return process.env.NEXT_PUBLIC_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

export default function AuthModal() {
  const { showAuthModal, authModalView, setShowAuthModal, setUser } = useCalculatorStore();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'sign_in' | 'sign_up' | 'forgot_password'>(authModalView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync view with store
  useEffect(() => {
    setView(authModalView);
    setError(null);
    setMessage(null);
  }, [authModalView, showAuthModal]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setShowAuthModal]);

  if (!showAuthModal || !mounted) return null;

  // Show configuration warning if Supabase isn't set up
  if (!isSupabaseConfigured) {
    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowAuthModal(false);
        }}
      >
        <div className="card max-w-md w-full p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Setup Required</h2>
            <button
              onClick={() => setShowAuthModal(false)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <p className="text-zinc-400 mb-4">
              Authentication requires Supabase configuration. Please add your environment variables.
            </p>
            <button onClick={() => setShowAuthModal(false)} className="btn-secondary px-6 py-2.5">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      if (error) throw error;
      setMessage('Check your email for a confirmation link!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getSiteUrl()}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/auth/callback`,
      });
      if (error) throw error;
      setMessage('Check your email for a password reset link!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: 'sign_in' | 'sign_up' | 'forgot_password') => {
    setView(newView);
    setError(null);
    setMessage(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowAuthModal(false);
      }}
    >
      <div className="card max-w-sm w-full px-6 py-10 relative">
        {/* Close button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo / Branding */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white font-[var(--font-heading)]">
            {view === 'sign_in' && 'Welcome Back'}
            {view === 'sign_up' && 'Create Account'}
            {view === 'forgot_password' && 'Reset Password'}
          </h1>
          <p className="text-sm text-zinc-500 text-center">
            {view === 'sign_in' && 'Sign in to access your dashboard and saved scenarios'}
            {view === 'sign_up' && 'Start tracking your true hourly wage for free'}
            {view === 'forgot_password' && 'Enter your email and we\'ll send you a reset link'}
          </p>
        </div>

        {/* Success message */}
        {message && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
            {message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Forgot Password Form */}
        {view === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-semibold mt-1 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
            <button
              type="button"
              onClick={() => switchView('sign_in')}
              className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors text-center"
            >
              ← Back to sign in
            </button>
          </form>
        )}

        {/* Sign In / Sign Up Form */}
        {(view === 'sign_in' || view === 'sign_up') && (
          <>
            <form
              onSubmit={view === 'sign_in' ? handleEmailSignIn : handleEmailSignUp}
              className="flex flex-col gap-4"
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/[0.08] text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
              />

              {/* Forgot password link (sign in only) */}
              {view === 'sign_in' && (
                <button
                  type="button"
                  onClick={() => switchView('forgot_password')}
                  className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors text-right -mt-1"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm font-semibold mt-1 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {view === 'sign_in' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  view === 'sign_in' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-white/[0.08] bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              <FcGoogle className="w-5 h-5" />
              {view === 'sign_in' ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* Toggle between sign in and sign up */}
            <div className="flex justify-center gap-1 text-sm mt-6 text-zinc-500">
              <p>{view === 'sign_in' ? "Don't have an account?" : 'Already have an account?'}</p>
              <button
                onClick={() => switchView(view === 'sign_in' ? 'sign_up' : 'sign_in')}
                className="text-emerald-400 font-medium hover:underline"
              >
                {view === 'sign_in' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </>
        )}

        {/* Footer text */}
        <p className="text-[11px] text-zinc-600 mt-6 text-center leading-relaxed">
          By continuing, you agree to save your scenarios and track your financial progress securely.
        </p>
      </div>
    </div>
  );
}
