'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Flame, Trash2, CheckCircle2, Circle, Calendar, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { completeHabitToday, undoHabitCompletion, deleteHabit } from '@/app/actions/habits';
import { Habit } from '@/types';
import { useAuthStore } from '@/store/auth';

export default function HabitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const habitId = params?.id as string;
  const { user } = useAuthStore();

  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    loadHabitDetails();
  }, [habitId]);

  const loadHabitDetails = async () => {
    try {
      setLoading(true);

      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', habitId)
        .single();

      if (habitError || !habitData) {
        toast.error('Habit not found');
        router.push('/dashboard');
        return;
      }

      setHabit(habitData);

      // Fetch completion logs for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: logs } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .gte('completed_at', thirtyDaysAgo.toISOString().split('T')[0])
        .order('completed_at', { ascending: false });

      const completedDates = logs?.map((log: any) => log.completed_at) || [];
      setCompletions(completedDates);
      setTotalCompletions(completedDates.length);
      setCompletionPercentage(Math.round((completedDates.length / 30) * 100));

      // Calculate current streak
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (completedDates.includes(dateStr)) {
          streak++;
        } else {
          break;
        }
      }
      setCurrentStreak(streak);

      // Check if completed today
      const today = new Date().toISOString().split('T')[0];
      setCompletedToday(completedDates.includes(today));
    } catch (error) {
      console.error('Error loading habit:', error);
      toast.error('Failed to load habit details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteToday = async () => {
    if (!habit || !user?.id) {
      toast.error('Not authenticated');
      return;
    }

    const result = await completeHabitToday(habit.id, user.id);
    if (result.success) {
      toast.success(result.message);
      setCompletedToday(true);
      await loadHabitDetails();
    } else if (result.code === 'ALREADY_COMPLETED') {
      toast.info('Already completed today');
    } else {
      toast.error(result.error);
    }
  };

  const handleUndoToday = async () => {
    if (!habit || !user?.id) {
      toast.error('Not authenticated');
      return;
    }

    const result = await undoHabitCompletion(habit.id, undefined, user.id);
    if (result.success) {
      toast.success(result.message);
      setCompletedToday(false);
      await loadHabitDetails();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteHabit = async () => {
    if (!habit || !user?.id || !window.confirm('Are you sure you want to delete this habit?')) return;

    const result = await deleteHabit(habit.id, user.id);
    if (result.success) {
      toast.success(result.message);
      router.push('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <div className="animate-pulse">
            <Flame className="w-12 h-12 text-primary mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <p className="text-muted-foreground">Habit not found</p>
          <Link href="/dashboard" className="text-primary hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const days30 = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="px-8 py-4 flex items-center justify-between max-w-4xl mx-auto">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            {completedToday && <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />}
          </div>
        </div>
      </div>

      <div className="pt-24 px-8 pb-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: habit.color_code }}
                >
                  ✓
                </div>
                {habit.name}
              </h1>
              {habit.description && <p className="text-muted-foreground text-lg">{habit.description}</p>}
            </div>
            <button
              onClick={handleDeleteHabit}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:border-red-500/30 border border-transparent transition"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {completedToday ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleUndoToday}
                className="px-6 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 fill-current" />
                Completed Today - Undo
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCompleteToday}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition font-medium text-white flex items-center justify-center gap-2"
              >
                <Circle className="w-5 h-5" />
                Mark Complete Today
              </motion.button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Trophy className="w-4 h-4" />
                <span className="text-xs uppercase font-semibold">Current Streak</span>
              </div>
              <p className="text-3xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground mt-1">days 🔥</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs uppercase font-semibold">Total Completions</span>
              </div>
              <p className="text-3xl font-bold">{totalCompletions}</p>
              <p className="text-xs text-muted-foreground mt-1">in 30 days</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs uppercase font-semibold">Success Rate</span>
              </div>
              <p className="text-3xl font-bold">{completionPercentage}%</p>
              <p className="text-xs text-muted-foreground mt-1">completion rate</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase font-semibold">This Month</span>
              </div>
              <p className="text-3xl font-bold">{totalCompletions}/30</p>
              <p className="text-xs text-muted-foreground mt-1">days completed</p>
            </motion.div>
          </div>

          {/* 30-Day Calendar */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Last 30 Days
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              {days30.map((date) => {
                const isCompleted = completions.includes(date);
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <motion.div
                    key={date}
                    whileHover={{ scale: 1.1 }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs cursor-pointer transition ${
                      isCompleted
                        ? `bg-green-500/30 border border-green-500/50 font-bold`
                        : `border border-white/10 hover:border-white/20`
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    title={date}
                  >
                    {isCompleted ? '✓' : date.split('-')[2]}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
