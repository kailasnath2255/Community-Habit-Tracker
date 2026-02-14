/**
 * Type definitions for Supabase Database
 * TANKTIDE Audit compliant - 2 tables only
 */

export type Database = {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          color_code: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          color_code?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          color_code?: string;
        };
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          completed_at: string; // DATE format
        };
        Insert: {
          id?: string;
          habit_id: string;
          completed_at: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          completed_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
