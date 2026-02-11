'use client';

import { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useCalculatorStore } from '@/lib/store';

// Check if Supabase is properly configured
const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AuthModal() {
  const { showAuthModal, authModalView, setShowAuthModal, setUser } = useCalculatorStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setShowAuthModal]);

  if (!showAuthModal) return null;

  // Show configuration warning if Supabase isn't set up
  if (!isSupabaseConfigured) {
    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowAuthModal(false);
        }}
      >
        <div className="card card-glow max-w-md w-full p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Authentication Not Configured</h2>
            <button
              onClick={() => setShowAuthModal(false)}
              className="text-neutral-400 hover:text-white transition-colors"
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
            <p className="text-neutral-400 mb-4">
              To enable authentication, you need to configure Supabase:
            </p>
            <ol className="text-sm text-neutral-500 text-left space-y-2 mb-6">
              <li>1. Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">supabase.com</a></li>
              <li>2. Copy <code className="bg-[#1a1a1a] px-1.5 py-0.5 rounded">.env.example</code> to <code className="bg-[#1a1a1a] px-1.5 py-0.5 rounded">.env.local</code></li>
              <li>3. Add your Supabase URL and anon key</li>
              <li>4. Restart the dev server</li>
            </ol>
            <button
              onClick={() => setShowAuthModal(false)}
              className="btn-secondary px-6 py-2.5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowAuthModal(false);
      }}
    >
      <div className="card card-glow max-w-md w-full p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {authModalView === 'sign_in' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button
            onClick={() => setShowAuthModal(false)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Auth
          supabaseClient={supabase}
          view={authModalView}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#10b981',
                  brandAccent: '#059669',
                  inputBackground: 'rgba(26, 26, 26, 0.8)',
                  inputBorder: 'rgba(255, 255, 255, 0.08)',
                  inputText: '#e5e5e5',
                  inputPlaceholder: '#525252',
                },
                borderWidths: {
                  buttonBorderWidth: '0px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '12px',
                  buttonBorderRadius: '12px',
                  inputBorderRadius: '12px',
                },
              },
            },
            className: {
              container: 'auth-container',
              button: 'btn-primary w-full py-3',
              input: 'input-field w-full px-4 py-3',
              label: 'text-sm text-neutral-400 mb-2',
              anchor: 'text-[#10b981] hover:text-[#34d399] text-sm',
            },
          }}
          providers={[]}
          redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign In',
                link_text: "Don't have an account? Sign up",
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Create Account',
                link_text: 'Already have an account? Sign in',
              },
            },
          }}
        />

        <p className="text-xs text-neutral-600 mt-4 text-center">
          By signing in, you can save your scenarios and track your progress over time.
        </p>
      </div>
    </div>
  );
}
