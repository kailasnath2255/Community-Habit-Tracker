import { create } from 'zustand';
import { Habit, HabitLog } from '@/types';
import { supabase } from '@/lib/supabase';

interface UseHabitsStore {
  habits: Habit[];
  habitLogs: Record<string, HabitLog[]>;
  selectedHabit: Habit | null;
  isLoading: boolean;
  error: string | null;

  setHabits: (habits: Habit[]) => void;
  setSelectedHabit: (habit: Habit | null) => void;
  setHabitLogs: (habitId: string, logs: HabitLog[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  fetchHabits: (userId: string) => Promise<void>;
  fetchHabitLogs: (habitId: string) => Promise<void>;
  addHabit: (habit: Habit) => void;
  removeHabit: (habitId: string) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  clearError: () => void;
}

export const useHabitsStore = create<UseHabitsStore>((set, get) => ({
  habits: [],
  habitLogs: {},
  selectedHabit: null,
  isLoading: false,
  error: null,

  setHabits: (habits) => set({ habits }),
  setSelectedHabit: (habit) => set({ selectedHabit: habit }),
  setHabitLogs: (habitId, logs) =>
    set((state) => ({
      habitLogs: { ...state.habitLogs, [habitId]: logs },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchHabits: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ habits: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHabitLogs: async (habitId: string) => {
    try {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      get().setHabitLogs(habitId, data || []);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addHabit: (habit) =>
    set((state) => ({
      habits: [habit, ...state.habits],
    })),

  removeHabit: (habitId) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== habitId),
    })),

  updateHabit: (habitId, updates) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId ? { ...h, ...updates } : h
      ),
    })),

  clearError: () => set({ error: null }),
}));
