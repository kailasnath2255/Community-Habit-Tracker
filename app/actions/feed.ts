'use server';

import { createClient } from '@/lib/supabase-server';

export interface CommunityFeedPost {
  id: string;
  habit_id: string;
  habit_name: string;
  color_code: string | null;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  completed_at: string;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  current_user_liked: boolean;
  current_user_saved: boolean;
}

/**
 * Fetch comprehensive community feed with aggregations
 */
export async function getCommunityFeed(
  currentUserId?: string,
  limit = 50,
  offset = 0
): Promise<{
  success: boolean;
  data?: CommunityFeedPost[];
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Fetch habit logs with limits
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select('id, habit_id, completed_at')
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1) as any;

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      return { success: true, data: [] };
    }

    const habitLogIds = (logs as any[]).map((l) => l.id);
    const habitIds = (logs as any[]).map((l) => l.habit_id);

    // Fetch habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, user_id, color_code')
      .in('id', habitIds) as any;

    if (habitsError) throw habitsError;

    const habitMap = new Map(habits?.map((h: any) => [h.id, h]) || []);

    // Fetch user profiles
    const userIds = Array.from(
      new Set(
        (habits as any[]).map((h) => h.user_id).filter(Boolean)
      )
    );

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds) as any;

    if (usersError) throw usersError;

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);

    // Fetch images
    const { data: images } = await supabase
      .from('completion_images')
      .select('habit_log_id, image_url')
      .in('habit_log_id', habitLogIds) as any;

    const imageMap = new Map(
      images?.map((img: any) => [img.habit_log_id, img.image_url]) || []
    );

    // Fetch likes
    const { data: likes } = await supabase
      .from('completion_likes')
      .select('habit_log_id')
      .in('habit_log_id', habitLogIds) as any;

    const likeCounts = new Map();
    likes?.forEach((like: any) => {
      likeCounts.set(
        like.habit_log_id,
        (likeCounts.get(like.habit_log_id) || 0) + 1
      );
    });

    // Fetch comments
    const { data: comments } = await supabase
      .from('completion_comments')
      .select('habit_log_id')
      .in('habit_log_id', habitLogIds) as any;

    const commentCounts = new Map();
    comments?.forEach((comment: any) => {
      commentCounts.set(
        comment.habit_log_id,
        (commentCounts.get(comment.habit_log_id) || 0) + 1
      );
    });

    // Fetch shares
    const { data: shares } = await supabase
      .from('completion_shares')
      .select('habit_log_id')
      .in('habit_log_id', habitLogIds) as any;

    const shareCounts = new Map();
    shares?.forEach((share: any) => {
      shareCounts.set(
        share.habit_log_id,
        (shareCounts.get(share.habit_log_id) || 0) + 1
      );
    });

    // Fetch current user's likes and saves
    const userLikedMap = new Map();
    const userSavedMap = new Map();

    if (currentUserId) {
      const { data: userLikes } = await supabase
        .from('completion_likes')
        .select('habit_log_id')
        .eq('user_id', currentUserId)
        .in('habit_log_id', habitLogIds);

      userLikes?.forEach((like: any) => {
        userLikedMap.set(like.habit_log_id, true);
      });

      const { data: userSaves } = await supabase
        .from('completion_saves')
        .select('habit_log_id')
        .eq('user_id', currentUserId)
        .in('habit_log_id', habitLogIds);

      userSaves?.forEach((save: any) => {
        userSavedMap.set(save.habit_log_id, true);
      });
    }

    // Build posts
    const posts: CommunityFeedPost[] = ((logs || []) as any[]).map((log: any) => {
      const habit = habitMap.get(log.habit_id) as any;
      const user = userMap.get(habit?.user_id) as any;

      return {
        id: log.id,
        habit_id: log.habit_id,
        habit_name: habit?.name || 'Unknown',
        color_code: habit?.color_code || null,
        user_id: habit?.user_id || '',
        user_name: user?.full_name || 'Anonymous',
        user_avatar: user?.avatar_url || null,
        completed_at: log.completed_at,
        image_url: (imageMap.get(log.id) as string | null) || null,
        like_count: likeCounts.get(log.id) || 0,
        comment_count: commentCounts.get(log.id) || 0,
        share_count: shareCounts.get(log.id) || 0,
        current_user_liked: userLikedMap.has(log.id),
        current_user_saved: userSavedMap.has(log.id),
      };
    });

    return { success: true, data: posts };
  } catch (error) {
    console.error('Error fetching community feed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch feed',
    };
  }
}

/**
 * Fetch single post with full details
 */
export async function getPostDetails(
  habitLogId: string,
  currentUserId?: string
): Promise<{
  success: boolean;
  data?: CommunityFeedPost;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Fetch habit log
    const { data: log, error: logError } = await supabase
      .from('habit_logs')
      .select('id, habit_id, completed_at')
      .eq('id', habitLogId)
      .single() as any;

    if (logError) throw logError;

    // Fetch habit
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, name, user_id, color_code')
      .eq('id', (log as any).habit_id)
      .single() as any;

    if (habitError) throw habitError;

    // Fetch user
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('id', (habit as any).user_id)
      .single() as any;

    // Fetch image
    const { data: imageData } = await supabase
      .from('completion_images')
      .select('image_url')
      .eq('habit_log_id', habitLogId)
      .single() as any;

    // Fetch like count
    const { count: likeCount } = await supabase
      .from('completion_likes')
      .select('*', { count: 'exact', head: true })
      .eq('habit_log_id', habitLogId);

    // Fetch comment count
    const { count: commentCount } = await supabase
      .from('completion_comments')
      .select('*', { count: 'exact', head: true })
      .eq('habit_log_id', habitLogId);

    // Fetch share count
    const { count: shareCount } = await supabase
      .from('completion_shares')
      .select('*', { count: 'exact', head: true })
      .eq('habit_log_id', habitLogId);

    // Check current user's like and save
    let currentUserLiked = false;
    let currentUserSaved = false;

    if (currentUserId) {
      const { data: likeData } = await supabase
        .from('completion_likes')
        .select('id')
        .eq('habit_log_id', habitLogId)
        .eq('user_id', currentUserId)
        .single();

      currentUserLiked = !!likeData;

      const { data: saveData } = await supabase
        .from('completion_saves')
        .select('id')
        .eq('habit_log_id', habitLogId)
        .eq('user_id', currentUserId)
        .single();

      currentUserSaved = !!saveData;
    }

    const post: CommunityFeedPost = {
      id: (log as any).id,
      habit_id: (log as any).habit_id,
      habit_name: (habit as any).name,
      color_code: (habit as any).color_code || null,
      user_id: (habit as any).user_id,
      user_name: (user as any)?.full_name || 'Anonymous',
      user_avatar: (user as any)?.avatar_url || null,
      completed_at: (log as any).completed_at,
      image_url: (imageData as any)?.image_url || null,
      like_count: likeCount || 0,
      comment_count: commentCount || 0,
      share_count: shareCount || 0,
      current_user_liked: currentUserLiked,
      current_user_saved: currentUserSaved,
    };

    return { success: true, data: post };
  } catch (error) {
    console.error('Error fetching post details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch post',
    };
  }
}
