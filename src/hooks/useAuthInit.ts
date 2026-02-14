import { useEffect } from 'react';
import { useCalculatorStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

/**
 * Initializes auth state: fetches the current session, subscribes to auth
 * changes, and keeps `user` + `subscriptionStatus` in the global store in sync.
 *
 * If the DB still says "free", calls /api/verify-payment as a fallback to
 * check Stripe directly (handles cases where webhooks failed or haven't arrived).
 */
export function useAuthInit() {
  const { setUser, setSubscriptionStatus } = useCalculatorStore();

  useEffect(() => {
    const fetchSubscriptionStatus = async (userId: string, accessToken: string) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('subscription_status')
          .eq('id', userId)
          .single();

        if (!error && data) {
          const status = data.subscription_status || 'free';

          if (status === 'premium' || status === 'lifetime') {
            setSubscriptionStatus(status);
            return;
          }

          // DB says free — check Stripe directly in case webhook failed
          try {
            const res = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            });
            const result = await res.json();
            if (result.status === 'premium' || result.status === 'lifetime') {
              setSubscriptionStatus(result.status);
              return;
            }
          } catch {
            // verify-payment failed, stick with DB value
          }

          setSubscriptionStatus(status);
        } else {
          setSubscriptionStatus('free');
        }
      } catch {
        setSubscriptionStatus('free');
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchSubscriptionStatus(session.user.id, session.access_token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchSubscriptionStatus(session.user.id, session.access_token);
      } else {
        setSubscriptionStatus(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSubscriptionStatus]);
}
