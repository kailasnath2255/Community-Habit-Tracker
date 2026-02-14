'use server';

import { createClient } from '@/lib/supabase-server';

export async function fetchUserProfiles(userIds: string[]): Promise<Record<string, { name: string; avatar: string | null }>> {
  try {
    if (!userIds || userIds.length === 0) return {};

    const supabase = createClient();

    // Query the users table directly (no service role needed)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (error) {
      console.error('Error fetching user profiles:', error);
      return {};
    }

    if (!users) return {};

    // Create a map of user_id -> { name, avatar }
    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    users.forEach((user: any) => {
      profileMap[user.id] = {
        name: user.full_name || 'Anonymous',
        avatar: user.avatar_url,
      };
    });

    return profileMap;
  } catch (error) {
    console.error('Error in fetchUserProfiles:', error);
    return {};
  }
}
