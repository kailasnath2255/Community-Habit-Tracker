/**
 * Type definitions for Supabase Database
 * Generated from actual database schema
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          updated_at?: string;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          color_code: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          color_code: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          color_code?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          completed_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          completed_at?: string;
          created_at?: string;
        };
      };
      completion_images: {
        Row: {
          id: string;
          habit_log_id: string;
          image_url: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          habit_log_id: string;
          image_url: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          habit_log_id?: string;
          image_url?: string;
          uploaded_at?: string;
        };
      };
      completion_saves: {
        Row: {
          id: string;
          habit_log_id: string;
          user_id: string;
          saved_at: string;
        };
        Insert: {
          id?: string;
          habit_log_id: string;
          user_id: string;
          saved_at?: string;
        };
        Update: {
          id?: string;
          habit_log_id?: string;
          user_id?: string;
          saved_at?: string;
        };
      };
      completion_likes: {
        Row: {
          id: string;
          habit_log_id: string;
          user_id: string;
          liked_at: string;
        };
        Insert: {
          id?: string;
          habit_log_id: string;
          user_id: string;
          liked_at?: string;
        };
        Update: {
          id?: string;
          habit_log_id?: string;
          user_id?: string;
          liked_at?: string;
        };
      };
      completion_comments: {
        Row: {
          id: string;
          habit_log_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          habit_log_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          habit_log_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
