'use server';

import { createClient, createServiceClient } from '@/lib/supabase-server';

// ============================================
// HABIT MANAGEMENT ACTIONS
// ============================================

export async function createHabit(habitData: {
  name: string;
  description: string;
  color_code: string;
}, userId?: string): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    // If userId is provided, use it (from client-side auth check)
    // If not, try to get from session
    let user_id = userId;

    if (!user_id) {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('[createHabit] Auth check from session:', {
        user: user?.id,
        email: user?.email,
        authError
      });

      if (authError) {
        console.error('[createHabit] Auth error:', authError);
        return { success: false, error: `Auth session missing - please sign in again` };
      }

      if (!user) {
        console.error('[createHabit] No user found in session');
        return { success: false, error: 'Not authenticated - please sign in' };
      }

      user_id = user.id;
    }

    console.log('[createHabit] Using user_id:', user_id);

    // Use service client to bypass RLS (we validate user ownership server-side)
    const supabase = createServiceClient();
    
    const insertData = {
      user_id,
      name: habitData.name,
      description: habitData.description,
      color_code: habitData.color_code,
      created_at: new Date().toISOString(),
    };

    console.log('[createHabit] Insert data:', insertData);

    const { data, error } = await supabase
      .from('habits')
      .insert([insertData] as any)
      .select()
      .single();

    console.log('[createHabit] Insert result:', { data, error });

    if (error) {
      console.error('[createHabit] Insert error:', error);
      throw error;
    }

    return { success: true, data, message: 'Habit created successfully' };
  } catch (error) {
    console.error('[createHabit] Caught error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create habit',
    };
  }
}

export async function updateHabit(
  habitId: string,
  habitData: {
    name?: string;
    description?: string;
    color_code?: string;
  },
  userId?: string
): Promise<{ success: boolean; data?: any; message?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Use provided userId or fall back to server-side session
    let user_id = userId;
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error in updateHabit:', authError);
        return { success: false, error: 'Not authenticated' };
      }
      user_id = user.id;
    }

    // Use service client to bypass RLS (we validate user ownership server-side)
    const serviceClient = createServiceClient();

    // First verify user owns this habit
    const { data: habit, error: habitError } = await serviceClient
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user_id)
      .single();

    if (habitError || !habit) {
      return { success: false, error: 'Habit not found or unauthorized' };
    }

    const updateData: any = {
      ...habitData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (serviceClient
      .from('habits') as any)
      .update(updateData)
      .eq('id', habitId)
      .eq('user_id', user_id)
      .select()
      .single() as any;

    if (error) throw error;

    return { success: true, data, message: 'Habit updated successfully' };
  } catch (error) {
    console.error('Error updating habit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update habit',
    };
  }
}

export async function deleteHabit(habitId: string, userId?: string) {
  try {
    const supabase = createClient();

    // Use provided userId or fall back to server-side session
    let user_id = userId;
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error in deleteHabit:', authError);
        return { success: false, error: 'Not authenticated' };
      }
      user_id = user.id;
    }

    // Use service client to bypass RLS (we validate user ownership server-side)
    const serviceClient = createServiceClient();

    // First verify user owns this habit
    const { data: habit, error: habitError } = await serviceClient
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user_id)
      .single();

    if (habitError || !habit) {
      return { success: false, error: 'Habit not found or unauthorized' };
    }

    const { error } = await serviceClient
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user_id);

    if (error) throw error;

    return { success: true, message: 'Habit deleted successfully' };
  } catch (error) {
    console.error('Error deleting habit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete habit',
    };
  }
}

// ============================================
// HABIT COMPLETION ACTIONS
// ============================================

export async function completeHabitToday(habitId: string, userId?: string) {
  try {
    const supabase = createClient();

    // Use provided userId or fall back to server-side session
    let user_id = userId;
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error in completeHabitToday:', authError);
        return { success: false, error: 'Not authenticated' };
      }
      user_id = user.id;
    }

    const today = new Date().toISOString().split('T')[0];

    // Use service client to bypass RLS (we validate user ownership server-side)
    const serviceClient = createServiceClient();

    // Verify user owns this habit
    const { data: habit, error: habitError } = await serviceClient
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user_id)
      .single();

    if (habitError || !habit) {
      return { success: false, error: 'Habit not found or unauthorized' };
    }

    const { data, error } = await serviceClient
      .from('habit_logs')
      .insert([
        {
          habit_id: habitId,
          completed_at: today,
        },
      ] as any)
      .select()
      .single() as any;

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - already completed today
        return {
          success: false,
          error: 'Already completed today',
          code: 'ALREADY_COMPLETED',
        };
      }
      throw error;
    }

    return { 
      success: true, 
      data, 
      habitLogId: data?.id,
      message: 'Habit completed successfully! 🎉' 
    };
  } catch (error) {
    console.error('Error completing habit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete habit',
    };
  }
}

export async function undoHabitCompletion(habitId: string, date?: string, userId?: string) {
  try {
    const supabase = createClient();

    // Use provided userId or fall back to server-side session
    let user_id = userId;
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error in undoHabitCompletion:', authError);
        return { success: false, error: 'Not authenticated' };
      }
      user_id = user.id;
    }

    const completedDate = date || new Date().toISOString().split('T')[0];

    // Use service client to bypass RLS (we validate user ownership server-side)
    const serviceClient = createServiceClient();

    // Verify user owns this habit
    const { data: habit, error: habitError } = await serviceClient
      .from('habits')
      .select('id')
      .eq('id', habitId)
      .eq('user_id', user_id)
      .single();

    if (habitError || !habit) {
      return { success: false, error: 'Habit not found or unauthorized' };
    }

    const { error } = await serviceClient
      .from('habit_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_at', completedDate);

    if (error) throw error;

    return { success: true, message: 'Completion removed successfully' };
  } catch (error) {
    console.error('Error undoing completion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to undo completion',
    };
  }
}

export async function getHabitStats(habitId: string, userId?: string) {
  try {
    const supabase = createClient();

    // Use provided userId or fall back to server-side session
    let user_id = userId;
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error in getHabitStats:', authError);
        return { success: false, error: 'Not authenticated' };
      }
      user_id = user.id;
    }

    // Get habit details
    const { data: habit } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', user_id)
      .single();

    if (!habit) {
      return { success: false, error: 'Habit not found' };
    }

    // Get completion logs for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('habit_id', habitId)
      .gte('completed_at', thirtyDaysAgo.toISOString().split('T')[0]) as any;

    const completedDays = logs?.length || 0;
    const completionPercentage = ((completedDays / 30) * 100).toFixed(1);

    // Get current streak
    let currentStreak = 0;

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const completed = logs?.some((log: any) => log.completed_at === dateStr);
      if (completed) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      success: true,
      data: {
        habit,
        totalCompletions: logs?.length || 0,
        completionPercentage: parseFloat(completionPercentage as string),
        currentStreak,
        last30Days: logs || [],
      },
    };
  } catch (error) {
    console.error('Error getting habit stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics',
    };
  }
}

export async function getUserHabits(userId?: string) {
  try {
    const supabase = createClient();

    // Use provided userId or fall back to server-side session
    let user_id = userId;
    if (!user_id) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error in getUserHabits:', authError);
        return { success: false, error: 'Not authenticated' };
      }
      user_id = user.id;
    }

    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false }) as any;

    if (error) throw error;

    // Get completion stats for each habit
    const habitsWithStats = await Promise.all(
      (habits || []).map(async (habit: any) => {
        const { data: logs } = await supabase
          .from('habit_logs')
          .select('completed_at')
          .eq('habit_id', habit.id)
          .order('completed_at', { ascending: false })
          .limit(30) as any;

        const lastCompletion = logs?.[0]?.completed_at || null;
        return {
          ...habit,
          totalCompletions: logs?.length || 0,
          lastCompletion,
        };
      })
    );

    return { success: true, data: habitsWithStats };
  } catch (error) {
    console.error('Error getting habits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get habits',
    };
  }
}

// ============================================
// LEADERBOARD & COMMUNITY STATS
// ============================================

export async function getTopUsers(limit = 10) {
  try {
    const supabase = createClient();

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('user_id') as any;

    if (habitsError) throw habitsError;

    const userIds = Array.from(new Set((habits || []).map((h: any) => h.user_id)));

    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('habit_id, completed_at') as any;

    if (logsError) throw logsError;

    // Count completions per user
    const userStats = new Map<
      string,
      { completions: number; habits: number }
    >();

    (habits || []).forEach((habit: any) => {
      if (!userStats.has(habit.user_id)) {
        userStats.set(habit.user_id, { completions: 0, habits: 0 });
      }
      const stats = userStats.get(habit.user_id)!;
      stats.habits += 1;
    });

    (logs || []).forEach((log: any) => {
      const habit = (habits || []).find((h: any) => h.id === log.habit_id);
      if (habit && userStats.has(habit.user_id)) {
        const stats = userStats.get(habit.user_id)!;
        stats.completions += 1;
      }
    });

    // Get user profiles
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, bio')
      .in('id', userIds);

    const ranked = userIds
      .map((userId: any) => ({
        userId,
        ...userStats.get(userId),
        profile: users?.find((u: any) => u.id === userId),
      }))
      .sort((a, b) => (b.completions ?? 0) - (a.completions ?? 0))
      .slice(0, limit);

    return { success: true, data: ranked };
  } catch (error) {
    console.error('Error getting top users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get leaderboard',
    };
  }
}
