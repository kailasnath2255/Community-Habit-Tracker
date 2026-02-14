'use server';

import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Add an image to a habit completion
 */
export async function addCompletionImage(
  habitLogId: string,
  imageUrl: string,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();
    const serviceClient = createServiceClient();

    // Verify user owns this habit log
    const { data: habitLog, error: logError } = await supabase
      .from('habit_logs')
      .select('id, habit_id')
      .eq('id', habitLogId)
      .single() as any;

    if (logError || !habitLog) {
      return { success: false, error: 'Habit log not found' };
    }

    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('user_id')
      .eq('id', (habitLog as any).habit_id)
      .single() as any;

    if (habitError || !habit || (habit as any).user_id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await ((serviceClient as any)
      .from('completion_images')
      .upsert(
        [{ habit_log_id: habitLogId, image_url: imageUrl }],
        { onConflict: 'habit_log_id' }
      )
      .select()
      .single() as any);

    if (error) {
      console.error('Error adding image:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in addCompletionImage:', error);
    return { success: false, error: 'Failed to add image' };
  }
}

/**
 * Delete image from a completion
 */
export async function deleteCompletionImage(
  habitLogId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();
    const serviceClient = createServiceClient();

    // Verify ownership
    const { data: image } = await supabase
      .from('completion_images')
      .select('habit_log_id')
      .eq('habit_log_id', habitLogId)
      .single();

    if (!image) {
      return { success: false, error: 'Image not found' };
    }

    const { error } = await serviceClient
      .from('completion_images')
      .delete()
      .eq('habit_log_id', habitLogId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCompletionImage:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}

/**
 * Toggle like on a completion
 */
export async function toggleCompletionLike(
  habitLogId: string,
  userId: string
): Promise<{ success: boolean; liked?: boolean; count?: number; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();
    const serviceClient = createServiceClient();

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('completion_likes')
      .select('id')
      .eq('habit_log_id', habitLogId)
      .eq('user_id', userId)
      .single();

    let liked = false;
    if (existingLike) {
      // Unlike
      await serviceClient
        .from('completion_likes')
        .delete()
        .eq('habit_log_id', habitLogId)
        .eq('user_id', userId);
      liked = false;
    } else {
      // Like
      await ((serviceClient as any)
        .from('completion_likes')
        .insert({ habit_log_id: habitLogId, user_id: userId }));
      liked = true;
    }

    // Get updated count
    const { count } = await supabase
      .from('completion_likes')
      .select('*', { count: 'exact', head: true })
      .eq('habit_log_id', habitLogId);

    return { success: true, liked, count: count || 0 };
  } catch (error) {
    console.error('Error in toggleCompletionLike:', error);
    return { success: false, error: 'Failed to toggle like' };
  }
}

/**
 * Add a comment to a completion
 */
export async function addCompletionComment(
  habitLogId: string,
  content: string,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const serviceClient = createServiceClient();

    if (!content.trim()) {
      return { success: false, error: 'Comment cannot be empty' };
    }

    const { data, error } = await ((serviceClient as any)
      .from('completion_comments')
      .insert({
        habit_log_id: habitLogId,
        user_id: userId,
        content: content.trim(),
      })
      .select()
      .single() as any);

    if (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in addCompletionComment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

/**
 * Delete a comment
 */
export async function deleteCompletionComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const serviceClient = createServiceClient();

    const { error } = await serviceClient
      .from('completion_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCompletionComment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

/**
 * Get likes for a completion
 */
export async function getCompletionLikes(
  habitLogId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('completion_likes')
      .select('user_id')
      .eq('habit_log_id', habitLogId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getCompletionLikes:', error);
    return { success: false, error: 'Failed to fetch likes' };
  }
}

/**
 * Get comments for a completion (with user info)
 */
export async function getCompletionComments(
  habitLogId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('completion_comments')
      .select('id, content, created_at, user_id')
      .eq('habit_log_id', habitLogId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message };
    }

    // Fetch user info separately to avoid join issues
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);
      const commentsWithUsers = data.map((c: any) => ({
        ...c,
        user: userMap.get(c.user_id),
      }));

      return { success: true, data: commentsWithUsers };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getCompletionComments:', error);
    return { success: false, error: 'Failed to fetch comments' };
  }
}

/**
 * Share a completion (with ownership verification)
 * Only the post owner can share to internal feed
 */
export async function shareCompletionInternal(
  habitLogId: string,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();

    // Verify habit log exists
    const { data: habitLog, error: logError } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('id', habitLogId)
      .single() as any;

    if (logError || !habitLog) {
      return { success: false, error: 'Habit log not found' };
    }

    // Check if already shared by this user
    const { data: existingShare } = await supabase
      .from('completion_shares')
      .select('id')
      .eq('habit_log_id', habitLogId)
      .eq('user_id', userId)
      .single() as any;

    if (existingShare) {
      return { success: false, error: 'You already shared this post' };
    }

    const { data, error } = await ((supabase as any)
      .from('completion_shares')
      .insert({
        habit_log_id: habitLogId,
        user_id: userId,
        share_type: 'internal',
      })
      .select()
      .single() as any);

    if (error) {
      console.error('Error sharing completion:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in shareCompletionInternal:', error);
    return { success: false, error: 'Failed to share' };
  }
}

/**
 * Check if user owns a post (habit log)
 */
export async function isPostOwner(
  habitLogId: string,
  userId: string
): Promise<{ success: boolean; isOwner?: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: true, isOwner: false };
    }

    const supabase = createClient();

    const { data: habitLog, error: logError } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('id', habitLogId)
      .single() as any;

    if (logError || !habitLog) {
      return { success: false, error: 'Habit log not found' };
    }

    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('user_id')
      .eq('id', (habitLog as any).habit_id)
      .single() as any;

    if (habitError || !habit) {
      return { success: true, isOwner: false };
    }

    return { success: true, isOwner: (habit as any).user_id === userId };
  } catch (error) {
    console.error('Error checking post ownership:', error);
    return { success: false, error: 'Failed to check ownership' };
  }
}

/**
 * Get share info for a post
 */
export async function getShareInfo(
  habitLogId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient();

    // Get share count
    const { count } = await supabase
      .from('completion_shares')
      .select('*', { count: 'exact', head: true })
      .eq('habit_log_id', habitLogId);

    // Get who shared it
    const { data: shares } = await supabase
      .from('completion_shares')
      .select('user_id, created_at')
      .eq('habit_log_id', habitLogId)
      .order('created_at', { ascending: false }) as any;

    if (shares && shares.length > 0) {
      const userIds = [...new Set(shares.map((s: any) => s.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);
      const sharesWithUsers = shares.map((s: any) => ({
        ...s,
        user: userMap.get(s.user_id),
      }));

      return { success: true, data: { count, shares: sharesWithUsers } };
    }

    return { success: true, data: { count: count || 0, shares: [] } };
  } catch (error) {
    console.error('Error in getShareInfo:', error);
    return { success: false, error: 'Failed to fetch share info' };
  }
}

/**
 * Share a completion (LEGACY - use shareCompletionInternal instead)
 */
export async function shareCompletion(
  habitLogId: string,
  userId: string,
  shareType: string = 'internal'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = createClient();

    // Verify habit log exists
    const { data: habitLog, error: logError } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('id', habitLogId)
      .single() as any;

    if (logError || !habitLog) {
      return { success: false, error: 'Habit log not found' };
    }

    // Check if already shared by this user
    const { data: existingShare } = await supabase
      .from('completion_shares')
      .select('id')
      .eq('habit_log_id', habitLogId)
      .eq('user_id', userId)
      .single() as any;

    if (existingShare) {
      return { success: false, error: 'You already shared this post' };
    }

    const { data, error } = await ((supabase as any)
      .from('completion_shares')
      .insert({
        habit_log_id: habitLogId,
        user_id: userId,
        share_type: shareType,
      })
      .select()
      .single() as any);

    if (error) {
      console.error('Error sharing completion:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in shareCompletion:', error);
    return { success: false, error: 'Failed to share' };
  }
}

/**
 * Get image for a completion
 */
export async function getCompletionImage(
  habitLogId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('completion_images')
      .select('*')
      .eq('habit_log_id', habitLogId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return { success: false, error: error.message };
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error('Error in getCompletionImage:', error);
    return { success: false, error: 'Failed to fetch image' };
  }
}
