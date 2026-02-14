'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, LogOut, BarChart3, Flame, User, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useHabitsStore } from '@/store/habits';
import { Habit } from '@/types';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { habits } = useHabitsStore();
  const { fetchHabits } = useHabitsStore();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!mounted) return;

      try {
        console.log('Dashboard: Checking auth...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('Dashboard: No user found, redirecting to login');
          setAuthChecked(true);
          router.push('/auth/login');
          return;
        }
        
        console.log('Dashboard: User found:', user.email);
        // Set user in store and fetch habits
        useAuthStore.setState({ user, isAuthenticated: true, isLoading: false });
        await fetchHabits(user.id);
        setAuthChecked(true);
      } catch (error) {
        console.error('Dashboard: Auth check failed:', error);
        setAuthChecked(true);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [mounted, router, fetchHabits]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      window.location.href = '/';
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (!mounted || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Flame className="w-12 h-12 text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 border-r border-white/10 bg-black/30 backdrop-blur-md p-6 flex flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <Flame className="w-8 h-8 text-amber-400" />
          <span className="text-xl font-bold gradient-text">Habit Tracker</span>
        </Link>

        <nav className="space-y-2 flex-1">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/habits"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition text-muted-foreground hover:text-white"
          >
            My Habits
          </Link>
          <Link
            href="/community"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition text-muted-foreground hover:text-white"
          >
            Community
          </Link>
        </nav>

        <div className="space-y-2">
          <Link
            href="/profile"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-primary/50 hover:text-primary transition text-muted-foreground"
          >
            <User className="w-5 h-5" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-destructive/50 hover:text-destructive transition text-muted-foreground"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">{"Welcome back! Here's your habit overview."}</p>
          </div>
          <Link
            href="/habits/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white"
          >
            <Plus className="w-5 h-5" />
            New Habit
          </Link>
        </div>

        {/* Stats Cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted-foreground">Total Habits</h3>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{habits.length}</p>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted-foreground">Keep It Simple</h3>
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold">✓</p>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-muted-foreground">Status</h3>
              <Flame className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-3xl font-bold">Ready</p>
          </div>
        </motion.div>

        {/* Habits List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold mb-6">Your Habits</h2>
          {habits.length === 0 ? (
            <div className="text-center py-12 border border-white/10 rounded-xl">
              <p className="text-muted-foreground mb-4">No habits yet. Create your first habit!</p>
              <Link
                href="/habits/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white"
              >
                <Plus className="w-5 h-5" />
                Create First Habit
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {habits.map((habit: Habit) => (
                <motion.div
                  key={habit.id}
                  className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  whileHover={{ x: 4 }}
                >
                  <Link href={`/habits/${habit.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{habit.name}</h3>
                        {habit.description && (
                          <p className="text-muted-foreground text-sm">{habit.description}</p>
                        )}
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg text-2xl text-white"
                        style={{ backgroundColor: habit.color_code }}
                      >
                        →
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
