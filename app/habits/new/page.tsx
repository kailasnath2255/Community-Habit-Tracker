'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { createHabit } from '@/app/actions/habits';
import { useAuthStore } from '@/store/auth';
import { useHabitsStore } from '@/store/habits';
import { toast } from 'sonner';

export default function NewHabitPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addHabit } = useHabitsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color_code: '#3B82F6',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Habit name is required');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to create a habit');
      return;
    }

    setIsLoading(true);
    try {
      // Pass userId from auth store to ensure we have it on server
      const result = await createHabit({
        name: formData.name,
        description: formData.description || '',
        color_code: formData.color_code,
      }, user.id);

      console.log('[handleSubmit] Server action result:', result);

      if (!result.success) {
        throw new Error(result.error);
      }

      addHabit(result.data);
      toast.success('Habit created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Create habit error:', error);
      toast.error((error as Error).message || 'Failed to create habit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </div>

      <div className="pt-24 px-8 pb-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">Create New Habit</h1>
          <p className="text-muted-foreground mb-8">Start tracking a new daily habit</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Habit Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                placeholder="e.g., Morning Run, Read 30 minutes, Meditate"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
                placeholder="Why is this habit important to you? (optional)"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Habit Color</label>
              <input
                type="color"
                name="color_code"
                value={formData.color_code}
                onChange={handleChange}
                className="w-full h-10 rounded-lg cursor-pointer border border-white/10"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 transition font-medium text-white"
              >
                {isLoading ? 'Creating...' : 'Create Habit'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 px-4 py-3 rounded-lg border border-white/10 hover:border-white/20 transition font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
