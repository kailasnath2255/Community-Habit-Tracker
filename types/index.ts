/**
 * Application type definitions
 * TANKTIDE Audit compliant schema (2 tables only)
 */

// Database types
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  color_code: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  completed_at: string; // DATE format (YYYY-MM-DD)
};

// Streak predictor result
export type StreakPredictionResult = {
  percentage: number; // 0-100
};

// API Response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Form types
export type HabitFormData = {
  name: string;
  description?: string;
  color_code: string;
};

export type SignUpFormData = {
  email: string;
  password: string;
};

export type SignInFormData = {
  email: string;
  password: string;
};

// Community feed types
export type CommunityFeedItem = {
  id: string;
  habit_id: string;
  habit_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  completed_at: string;
};

// Community feature types
export type CompletionImage = {
  id: string;
  habit_log_id: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

export type CompletionLike = {
  id: string;
  habit_log_id: string;
  user_id: string;
  created_at: string;
};

export type CompletionComment = {
  id: string;
  habit_log_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  users?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type CompletionShare = {
  id: string;
  habit_log_id: string;
  user_id: string;
  share_type: string;
  created_at: string;
};
