import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useHabitsStore } from '@/store/habits';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook to initialize auth and check session
 */
export const useAuth = () => {
  const { checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, isAuthenticated: false });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth();
      }
    });

    return () => subscription?.unsubscribe();
  }, [checkAuth]);

  return { logout };
};

/**
 * Custom hook for real-time subscriptions
 */
export const useRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  filter?: { column: string; eq: string }
) => {
  useEffect(() => {
    let channel = supabase
      .channel(`${table}-${filter?.column || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.eq}` }),
        },
        callback
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, callback, filter]);
};

/**
 * Custom hook for habit operations
 */
export const useHabits = () => {
  const { habits, fetchHabits, addHabit, removeHabit, updateHabit } = useHabitsStore();

  const createHabit = useCallback(
    async (data: any) => {
      try {
        const { data: habit, error } = await (supabase.from('habits') as any).insert([data])
          .select()
          .single();

        if (error) throw error;
        addHabit(habit);
        return habit;
      } catch (error) {
        throw error;
      }
    },
    [addHabit]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      try {
        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', habitId);

        if (error) throw error;
        removeHabit(habitId);
      } catch (error) {
        throw error;
      }
    },
    [removeHabit]
  );

  return { habits, fetchHabits, createHabit, deleteHabit, updateHabit };
};
