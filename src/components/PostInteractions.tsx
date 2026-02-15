'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Bookmark, Eye, Share2, Check } from 'lucide-react';
import { APPLE_SPRING_GENTLE, HOVER_BUTTON, TAP_BUTTON } from './Animations';

interface PostInteractionsProps {
  postId: string;
  className?: string;
}

export default function PostInteractions({ postId, className = '' }: PostInteractionsProps) {
  const [stats, setStats] = useState({ views: 0, likes: 0, bookmarks: 0 });
  const [userLiked, setUserLiked] = useState(false);
  const [userBookmarked, setUserBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
    trackView();
  }, [postId]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/interactions?postId=${postId}`);
      const data = await res.json();
      if (data.success) {
        setStats({
          views: data.data.views,
          likes: data.data.likes,
          bookmarks: data.data.bookmarks,
        });
        setUserLiked(data.data.userLiked);
        setUserBookmarked(data.data.userBookmarked);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: window.location.pathname,
          title: document.title,
          postId,
        }),
      });
    } catch (error) {
      console.error('Track error:', error);
    }
  };

  const handleInteraction = async (type: 'like' | 'bookmark') => {
    try {
      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (type === 'like') {
          setUserLiked(data.action === 'added');
          setStats(prev => ({
            ...prev,
            likes: prev.likes + (data.action === 'added' ? 1 : -1),
          }));
        } else {
          setUserBookmarked(data.action === 'added');
          setStats(prev => ({
            ...prev,
            bookmarks: prev.bookmarks + (data.action === 'added' ? 1 : -1),
          }));
        }
      }
    } catch (error) {
      console.error('Interaction error:', error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (loading) return null;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* 浏览量 */}
      <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/35 px-2.5 py-1.5 text-muted-foreground">
        <Eye className="w-4 h-4" />
        <span className="text-sm">{stats.views}</span>
      </div>
      
      {/* 点赞 */}
      <motion.button
        whileHover={HOVER_BUTTON}
        whileTap={TAP_BUTTON}
        transition={APPLE_SPRING_GENTLE}
        onClick={() => handleInteraction('like')}
        className={`ios-button-press inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
          userLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
        }`}
      >
        <Heart className={`w-4 h-4 ${userLiked ? 'fill-current' : ''}`} />
        <span className="text-sm">{stats.likes}</span>
      </motion.button>
      
      {/* 收藏 */}
      <motion.button
        whileHover={HOVER_BUTTON}
        whileTap={TAP_BUTTON}
        transition={APPLE_SPRING_GENTLE}
        onClick={() => handleInteraction('bookmark')}
        className={`ios-button-press inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
          userBookmarked ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'
        }`}
      >
        <Bookmark className={`w-4 h-4 ${userBookmarked ? 'fill-current' : ''}`} />
        <span className="text-sm">{stats.bookmarks}</span>
      </motion.button>
      
      {/* 分享 */}
      <motion.button
        whileHover={HOVER_BUTTON}
        whileTap={TAP_BUTTON}
        transition={APPLE_SPRING_GENTLE}
        onClick={handleShare}
        className="ios-button-press inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-primary"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
      </motion.button>
    </div>
  );
}
