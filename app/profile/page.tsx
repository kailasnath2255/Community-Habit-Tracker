'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, User, Edit2, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User as UserType } from '@/types';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      setAuthUser(authUser);

      // Fetch user profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single() as any;

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is fine for new users
        throw error;
      }

      if (profile) {
        setUser(profile);
        setFormData({
          full_name: profile.full_name || '',
          bio: profile.bio || '',
        });
      } else {
        // Create default profile for new user
        const newProfile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.email?.split('@')[0] || 'User',
          avatar_url: null,
          bio: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(newProfile);
        setFormData({
          full_name: newProfile.full_name,
          bio: newProfile.bio,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!authUser) return;

      const { error } = await supabase
        .from('users')
        .upsert([
          {
            id: authUser.id,
            email: authUser.email,
            full_name: formData.full_name,
            bio: formData.bio,
            updated_at: new Date().toISOString(),
          },
        ] as any);

      if (error) throw error;

      setUser({
        ...user!,
        full_name: formData.full_name,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      });

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="animate-pulse">
            <User className="w-12 h-12 text-primary mx-auto" />
          </div>
        </div>
      </div>
    );
  }

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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              Your Profile
            </h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-8">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition font-medium"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                    <p className="text-2xl font-bold text-white">{user?.full_name || 'Not set'}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Email Address</p>
                  <div className="flex items-center gap-2 text-white">
                    <Mail className="w-5 h-5 text-primary" />
                    {authUser?.email}
                  </div>
                </div>

                {user?.bio && (
                  <div className="border-t border-white/10 pt-6">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bio</p>
                    <p className="text-white">{user.bio}</p>
                  </div>
                )}

                <div className="border-t border-white/10 pt-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Member Since</p>
                  <p className="text-white">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {!isEditing && (
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
