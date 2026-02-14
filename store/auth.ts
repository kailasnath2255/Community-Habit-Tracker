import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface UseAuthStore {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<UseAuthStore>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        set({ user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));

