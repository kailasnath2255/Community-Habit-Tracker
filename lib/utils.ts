/**
 * Utility functions
 */

export const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';

  return Math.floor(seconds) + ' seconds ago';
};

/**
 * Get category icon emoji
 */
export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    fitness: '💪',
    reading: '📚',
    meditation: '🧘',
    learning: '🎓',
    health: '❤️',
    productivity: '🚀',
    hobby: '🎨',
    work: '💼',
    spirituality: '✨',
    social: '👥',
    other: '⭐',
  };
  return icons[category.toLowerCase()] || '⭐';
};

/**
 * Get streak level color
 */
export const getStreakColor = (streak: number): string => {
  if (streak >= 100) return 'text-rose-500';
  if (streak >= 50) return 'text-orange-500';
  if (streak >= 20) return 'text-yellow-500';
  if (streak >= 7) return 'text-green-500';
  if (streak >= 3) return 'text-blue-500';
  return 'text-gray-500';
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Generate array of dates for last N days
 */
export const getLastNDays = (n: number): Date[] => {
  const dates: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }
  return dates;
};

/**
 * Format number with K, M suffix (e.g., 1500 -> 1.5K)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Randomly shuffle array
 */
export const shuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
