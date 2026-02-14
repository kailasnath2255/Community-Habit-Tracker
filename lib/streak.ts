import { HabitLog } from '@/types';

/**
 * Calculate streak predictor percentage for the last 7 days
 * Formula: (DaysCompletedInLast7 / 7) * 100
 * 
 * Returns 0-100 percentage
 * Edge cases:
 * - New habit (< 7 days old): Still divide by 7, missing days count as 0
 * - Today not completed yet: Count only previous 6 days
 * - No logs: Returns 0%
 */
export const predictFutureStreak = (logs: HabitLog[]): number => {
  if (!logs || logs.length === 0) return 0;

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count completions in the last 7 days (including today)
  let completedDaysCount = 0;

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const hasCompletion = logs.some((log) => log.completed_at === dateStr);
    if (hasCompletion) {
      completedDaysCount++;
    }
  }

  // Calculate percentage: (completed / 7) * 100
  const percentage = (completedDaysCount / 7) * 100;
  
  // Return as integer (0-100)
  return Math.round(percentage);
};

/**
 * Get today's completion status
 */
export const isCompletedToday = (logs: HabitLog[]): boolean => {
  if (!logs || logs.length === 0) return false;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return logs.some((log) => log.completed_at === today);
};

/**
 * Get completion status for a specific date
 */
export const isCompletedOnDate = (logs: HabitLog[], date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  return logs.some((log) => log.completed_at === dateStr);
};

/**
 * Get total completed days
 */
export const getTotalCompletions = (logs: HabitLog[]): number => {
  return logs ? logs.length : 0;};