'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Flame, Users, ArrowLeft, Clock, Zap, MessageCircle, Share2, Bookmark, Sparkles, Trophy, TrendingUp, Send, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getRelativeTime, formatDate } from '@/lib/utils';
import { toggleCompletionLike, addCompletionComment, getCompletionComments, shareCompletionInternal } from '@/app/actions/community-features';
import { getCommunityFeed, type CommunityFeedPost } from '@/app/actions/feed';
import { toggleSavePost } from '@/app/actions/saves';

export default function CommunityPage() {
  const [feedItems, setFeedItems] = useState<CommunityFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newActivityIndicator, setNewActivityIndicator] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewingSavedPosts, setViewingSavedPosts] = useState(false);
  
  // State for comments
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  
  // State for likes (now from server)
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  
  // State for saves (now from server)
  const [saved, setSaved] = useState<Set<string>>(new Set());
  
  // State for shares
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const initializeUser = async () => {
      await getCurrentUser();
      await fetchFeed();
      subscribeToRealtimeUpdates();
    };
    
    initializeUser();

    return () => {
      // Cleanup subscriptions
      supabase.channel('completion-likes').unsubscribe();
      supabase.channel('completion-comments').unsubscribe();
      supabase.channel('completion-shares').unsubscribe();
      supabase.channel('habit-logs').unsubscribe();
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const subscribeToRealtimeUpdates = () => {
    // Subscribe to new habit logs
    supabase
      .channel('habit-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'habit_logs',
        },
        () => {
          console.log('🔥 New habit completion received');
          setNewActivityIndicator(true);
          setTimeout(() => {
            fetchFeed();
            setTimeout(() => setNewActivityIndicator(false), 3000);
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 New posts subscription:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to likes
    supabase
      .channel('completion-likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completion_likes',
        },
        (payload: any) => {
          const habitLogId = payload.new?.habit_log_id || payload.old?.habit_log_id;
          if (habitLogId) {
            setLikes(prev => ({
              ...prev,
              [habitLogId]: Math.max(0, (prev[habitLogId] || 0) + (payload.eventType === 'INSERT' ? 1 : -1))
            }));
          }
        }
      )
      .subscribe();

    // Subscribe to comments
    supabase
      .channel('completion-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'completion_comments',
        },
        () => {
          console.log('📝 New comment received');
          fetchFeed();
        }
      )
      .subscribe();

    // Subscribe to shares
    supabase
      .channel('completion-shares')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'completion_shares',
        },
        () => {
          console.log('📤 New share received');
          fetchFeed();
        }
      )
      .subscribe();
  };

  const toggleLike = async (itemId: string) => {
    if (!currentUser) {
      toast.error('Please log in to like');
      return;
    }

    const result = await toggleCompletionLike(itemId, currentUser.id);
    if (result.success) {
      if (result.liked) {
        setUserLikes(prev => new Set([...prev, itemId]));
        setLikes(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      } else {
        const newLikes = new Set(userLikes);
        newLikes.delete(itemId);
        setUserLikes(newLikes);
        setLikes(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) - 1) }));
      }
    } else {
      toast.error(result.error || 'Failed to like');
    }
  };

  const loadComments = async (itemId: string) => {
    if (comments[itemId]) {
      const newExpanded = new Set(expandedComments);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      setExpandedComments(newExpanded);
      return;
    }

    const newLoading = new Set(loadingComments);
    newLoading.add(itemId);
    setLoadingComments(newLoading);

    const result = await getCompletionComments(itemId);
    if (result.success) {
      setComments(prev => ({ ...prev, [itemId]: result.data || [] }));
      const newExpanded = new Set(expandedComments);
      newExpanded.add(itemId);
      setExpandedComments(newExpanded);
    } else {
      toast.error('Failed to load comments');
    }

    newLoading.delete(itemId);
    setLoadingComments(newLoading);
  };

  const handleAddComment = async (itemId: string) => {
    if (!currentUser) {
      toast.error('Please log in to comment');
      return;
    }

    const text = commentText[itemId]?.trim();
    if (!text) {
      toast.error('Comment cannot be empty');
      return;
    }

    const result = await addCompletionComment(itemId, text, currentUser.id);
    if (result.success) {
      setCommentText(prev => ({ ...prev, [itemId]: '' }));
      await loadComments(itemId);
      toast.success('Comment added');
    } else {
      toast.error(result.error || 'Failed to add comment');
    }
  };

  const handleShare = async (itemId: string) => {
    if (!currentUser) {
      toast.error('Please log in to share');
      return;
    }

    const result = await shareCompletionInternal(itemId, currentUser.id);
    if (result.success) {
      // Update share count
      setShareCounts(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      toast.success('Post shared to community! 🎉');
    } else {
      toast.error(result.error || 'Failed to share');
    }
  };

  const toggleSave = async (itemId: string) => {
    if (!currentUser) {
      toast.error('Please log in to save');
      return;
    }

    const result = await toggleSavePost(itemId, currentUser.id);
    if (result.success) {
      if (result.saved) {
        setSaved(prev => new Set([...prev, itemId]));
        toast.success('Post saved');
      } else {
        const newSaved = new Set(saved);
        newSaved.delete(itemId);
        setSaved(newSaved);
        toast.success('Post unsaved');
      }
    } else {
      toast.error(result.error || 'Failed to save');
    }
  };

  const getHabitEmoji = (habitName: string): string => {
    const emojiMap: Record<string, string> = {
      'yoga': '🧘',
      'gym': '💪',
      'read': '📖',
      'meditat': '🧠',
      'run': '🏃',
      'cook': '👨‍🍳',
      'code': '💻',
      'exercise': '🏋️',
      'walk': '🚶',
      'swim': '🏊',
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (habitName.toLowerCase().includes(key)) return emoji;
    }
    return '⭐';
  };

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const result = await getCommunityFeed(currentUser?.id);
      
      if (result.success && result.data) {
        setFeedItems(result.data);
        
        // Initialize state from server data
        const likeMap: Record<string, number> = {};
        const userLikeSet = new Set<string>();
        const savedSet = new Set<string>();
        const shareMap: Record<string, number> = {};
        
        result.data.forEach(post => {
          likeMap[post.id] = post.like_count;
          shareMap[post.id] = post.share_count;
          
          if (post.current_user_liked) {
            userLikeSet.add(post.id);
          }
          if (post.current_user_saved) {
            savedSet.add(post.id);
          }
        });
        
        setLikes(likeMap);
        setUserLikes(userLikeSet);
        setSaved(savedSet);
        setShareCounts(shareMap);
        
        // Auto-load comments for all posts
        for (const post of result.data) {
          await loadComments(post.id);
        }
      } else {
        toast.error(result.error || 'Failed to load feed');
      }
    } catch (error) {
      console.error('Failed to fetch community feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            {newActivityIndicator && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs"
              >
                <Zap className="w-3 h-3" />
                New Posts
              </motion.div>
            )}
            <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
              <span className="hidden sm:inline">{isConnected ? 'Live' : 'Connecting'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-12 px-4 sm:px-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <h1 className="text-4xl md:text-5xl font-bold">
                {viewingSavedPosts ? 'Saved Posts' : 'Community Feed'}
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewingSavedPosts(!viewingSavedPosts)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                viewingSavedPosts
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-primary/20 hover:bg-primary/30 text-primary'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span className="hidden sm:inline">{viewingSavedPosts ? 'All Posts' : 'Saved Posts'}</span>
              <span className="sm:hidden">{viewingSavedPosts ? 'All' : 'Saved'}</span>
            </motion.button>
          </div>
          <p className="text-muted-foreground text-lg">
            {viewingSavedPosts ? 'Your favorite habits from the community' : 'Live updates from your community'}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{new Set((viewingSavedPosts ? feedItems.filter(f => saved.has(f.id)) : feedItems).map(f => f.user_id)).size} active users</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-muted-foreground">{viewingSavedPosts ? saved.size : feedItems.length} {viewingSavedPosts ? 'saved' : 'completions'}</span>
            </div>
          </div>
        </motion.div>

        {/* Feed Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="inline-block">
              <Flame className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            </motion.div>
            <p className="text-muted-foreground">Loading {viewingSavedPosts ? 'saved posts' : 'community feed'}...</p>
          </div>
        ) : (viewingSavedPosts ? feedItems.filter(f => saved.has(f.id)) : feedItems).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent"
          >
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground mb-4">
              {viewingSavedPosts ? 'No saved posts yet. Save posts to see them here!' : 'No activities yet. Be the first!'}
            </p>
            <Link href={viewingSavedPosts ? '/community' : '/dashboard'} className="inline-block px-6 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition">
              {viewingSavedPosts ? 'Browse all posts' : 'Complete a habit now'}
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {(viewingSavedPosts ? feedItems.filter(f => saved.has(f.id)) : feedItems).map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] hover:border-white/20 hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 transition-all duration-300 overflow-hidden backdrop-blur-sm"
              >
                {/* Card Header - User Info */}
                <div className="px-6 py-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {item.user_avatar ? (
                        <Image
                          src={item.user_avatar}
                          alt={item.user_name}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm font-bold">
                          {item.user_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white">{item.user_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(item.completed_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content - Achievement */}
                <div className="px-6 py-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-4xl">{getHabitEmoji(item.habit_name)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Completed</span>
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{item.habit_name}</div>
                      <div className="text-sm text-muted-foreground">{formatDate(new Date(item.completed_at))}</div>
                    </div>
                  </div>
                  
                  {/* Image Display */}
                  {item.image_url ? (
                    <div className="mb-4 rounded-lg overflow-hidden border border-white/10 h-64 relative">
                      <Image
                        src={item.image_url}
                        alt="Completion"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-lg overflow-hidden border border-white/10 h-64 bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No image added</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Achievement Badge */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-yellow-300 font-medium">Great job! Keep the streak going! 🔥</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer - Engagement */}
                <div className="px-6 py-4 border-t border-white/5">
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleLike(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                          userLikes.has(item.id)
                            ? 'bg-red-500/20 text-red-400'
                            : 'hover:bg-white/5 text-muted-foreground hover:text-red-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${userLikes.has(item.id) ? 'fill-current' : ''}`} />
                        <span className="text-xs font-medium">{likes[item.id] || 0}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadComments(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-blue-400 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{comments[item.id]?.length || 0}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-green-400 transition"
                        title="Share to community"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="text-xs font-medium">{shareCounts[item.id] || 0}</span>
                      </motion.button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSave(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                        saved.has(item.id)
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'hover:bg-white/5 text-muted-foreground hover:text-amber-400'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${saved.has(item.id) ? 'fill-current' : ''}`} />
                    </motion.button>
                  </div>

                  {/* Comments Section - Always Visible */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3 pt-4 border-t border-white/5"
                  >
                    {/* Existing Comments */}
                    {comments[item.id]?.length > 0 ? (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                          {comments[item.id].map(comment => (
                            <div key={comment.id} className="flex gap-2 text-sm">
                              {comment.users?.avatar_url ? (
                                <Image
                                  src={comment.users.avatar_url}
                                  alt="Avatar"
                                  width={32}
                                  height={32}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold">
                                  {comment.users?.full_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-white text-xs">{comment.users?.full_name || 'Anonymous'}</div>
                                <div className="text-muted-foreground">{comment.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
                      )}

                      {/* Add Comment */}
                      {currentUser && (
                        <div className="flex gap-2 pt-2 border-t border-white/5">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText[item.id] || ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyPress={e => {
                              if (e.key === 'Enter') {
                                handleAddComment(item.id);
                              }
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary/50"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddComment(item.id)}
                            className="px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition"
                          >
                            <Send className="w-4 h-4" />
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
