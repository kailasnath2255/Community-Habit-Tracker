'use server';

import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Toggle save status for a completion
 */
export async function toggleSavePost(
  habitLogId: string,
  userId: string
): Promise<{ success: boolean; saved?: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();
    const serviceClient = createServiceClient();

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('completion_saves')
      .select('id')
      .eq('habit_log_id', habitLogId)
      .eq('user_id', userId)
      .single();

    let saved = false;
    if (existingSave) {
      // Unsave
      const { error: deleteError } = await serviceClient
        .from('completion_saves')
        .delete()
        .eq('habit_log_id', habitLogId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      saved = false;
    } else {
      // Save
      const { error: insertError } = await (serviceClient
        .from('completion_saves')
        .insert({
          habit_log_id: habitLogId,
          user_id: userId,
        }) as any);

      if (insertError) throw insertError;
      saved = true;
    }

    return { success: true, saved };
  } catch (error) {
    console.error('Error toggling save:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save post',
    };
  }
}

/**
 * Check if user has saved a post
 */
export async function isPostSaved(
  habitLogId: string,
  userId: string
): Promise<{ success: boolean; saved?: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: true, saved: false };
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('completion_saves')
      .select('id')
      .eq('habit_log_id', habitLogId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { success: true, saved: !!data };
  } catch (error) {
    console.error('Error checking save status:', error);
    return { success: false, error: 'Failed to check save status' };
  }
}

/**
 * Get all saved posts for user
 */
export async function getSavedPosts(
  userId: string
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();

    // Get saved habit log IDs
    const { data: saves, error: savesError } = await supabase
      .from('completion_saves')
      .select('habit_log_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (savesError) throw savesError;

    if (!saves || saves.length === 0) {
      return { success: true, data: [] };
    }

    const habitLogIds = saves.map((s: any) => s.habit_log_id);

    // Fetch habit logs with related data
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('id, habit_id, completed_at')
      .in('id', habitLogIds)
      .order('completed_at', { ascending: false });

    if (logsError) throw logsError;

    // Fetch habits
    const habitIds = Array.from(new Set((logs as any[]).map((l) => l.habit_id)));
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, user_id, color_code')
      .in('id', habitIds);

    const habitMap = new Map(habits?.map((h: any) => [h.id, h]) || []);

    // Fetch user profiles
    const userIds = Array.from(
      new Set(
        (logs as any[])
          .map((l) => habitMap.get(l.habit_id)?.user_id)
          .filter(Boolean)
      )
    );

    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);

    // Build posts
    const posts = (logs as any[]).map((log) => {
      const habit = habitMap.get(log.habit_id);
      const user = userMap.get(habit?.user_id);

      return {
        id: log.id,
        habit_id: log.habit_id,
        habit_name: habit?.name || 'Unknown',
        user_id: habit?.user_id,
        user_name: user?.full_name || 'Anonymous',
        user_avatar: user?.avatar_url,
        completed_at: log.completed_at,
        color_code: habit?.color_code,
      };
    });

    return { success: true, data: posts };
  } catch (error) {
    console.error('Error getting saved posts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch saved posts',
    };
  }
}

/**
 * Get share count for a post
 */
export async function getShareCount(
  habitLogId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = createClient();

    const { count, error } = await supabase
      .from('completion_shares')
      .select('*', { count: 'exact', head: true })
      .eq('habit_log_id', habitLogId);

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error getting share count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get share count',
    };
  }
}

/**
 * Get list of users who shared a post
 */
export async function getPostShares(
  habitLogId: string
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const supabase = createClient();

    const { data: shares, error: sharesError } = await supabase
      .from('completion_shares')
      .select('user_id, created_at')
      .eq('habit_log_id', habitLogId)
      .order('created_at', { ascending: false });

    if (sharesError) throw sharesError;

    if (!shares || shares.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch user info for sharers
    const userIds = [...new Set(shares.map((s: any) => s.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);

    const enrichedShares = shares.map((share: any) => ({
      ...share,
      user: userMap.get(share.user_id),
    }));

    return { success: true, data: enrichedShares };
  } catch (error) {
    console.error('Error getting post shares:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get shares',
    };
  }
}
