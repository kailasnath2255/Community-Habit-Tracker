'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

/**
 * Root provider that initializes auth globally
 * CRITICAL: This must be used in the root layout to ensure auth is properly set up
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initial auth check
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('[AuthProvider] Initial auth check:', {
          userId: user?.id,
          email: user?.email,
          error: error?.message,
        });

        if (user) {
          useAuthStore.setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('[AuthProvider] Init error:', error);
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: { user }, error: _error } = await supabase.auth.getUser();
          useAuthStore.setState({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
