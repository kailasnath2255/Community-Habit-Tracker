'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('No session created');
      }

      toast.success('Logged in successfully!');
      
      // Wait to ensure session cookie is set, then redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      toast.error((error as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-8">Sign in to continue tracking your habits</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                placeholder="Your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50 transition font-medium text-white mt-6"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            {"Don't have an account? "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
