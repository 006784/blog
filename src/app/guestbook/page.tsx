'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, User, Mail, Globe, Pin, Reply,
  Trash2, Check, X, Loader2, Heart
} from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';

interface Message {
  id: string;
  nickname: string;
  email?: string;
  content: string;
  avatar_url?: string;
  website?: string;
  is_pinned: boolean;
  reply?: string;
  replied_at?: string;
  created_at: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 获取管理员密码
function getAdminPassword(): string {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('admin-token');
  if (!token) return '';
  try { return atob(token); } catch { return ''; }
}

export default function GuestbookPage() {
  const { isAdmin } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 表单
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [content, setContent] = useState('');
  
  // 管理员回复
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/guestbook');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, email, website, content }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setContent('');
        fetchMessages();
      } else {
        alert(data.error || '发布失败');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyContent.trim()) return;
    
    try {
      const res = await fetch('/api/guestbook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: getAdminPassword(),
          id,
          reply: replyContent,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setReplyingId(null);
        setReplyContent('');
        fetchMessages();
      } else {
        alert(data.error || '回复失败');
      }
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      await fetch('/api/guestbook', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: getAdminPassword(),
          id,
          is_pinned: !isPinned,
        }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Pin error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条留言吗？')) return;
    
    try {
      await fetch('/api/guestbook', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: getAdminPassword(), id }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">留言板</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">给我留言</h1>
          <p className="text-muted-foreground">有什么想说的？随时欢迎留言交流</p>
        </motion.div>

        {/* 留言表单 */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-border p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="昵称 *"
                required
                maxLength={50}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱（用于头像）"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="网站（可选）"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>
          </div>
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="说点什么吧..."
            required
            maxLength={1000}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none resize-none mb-4"
          />
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {content.length}/1000
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting || !nickname.trim() || !content.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-medium disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              发布留言
            </motion.button>
          </div>
        </motion.form>

        {/* 留言列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>还没有留言，来做第一个吧！</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-5 rounded-2xl bg-card border ${msg.is_pinned ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex gap-4">
                    {/* 头像 */}
                    <img
                      src={msg.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.nickname}`}
                      alt={msg.nickname}
                      className="w-12 h-12 rounded-full bg-secondary"
                    />
                    
                    <div className="flex-1 min-w-0">
                      {/* 头部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {msg.is_pinned && (
                            <Pin className="w-3 h-3 text-primary" />
                          )}
                          {msg.website ? (
                            <a
                              href={msg.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {msg.nickname}
                            </a>
                          ) : (
                            <span className="font-medium">{msg.nickname}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        
                        {/* 管理员操作 */}
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTogglePin(msg.id, msg.is_pinned)}
                              className={`p-1.5 rounded-lg hover:bg-muted ${msg.is_pinned ? 'text-primary' : ''}`}
                              title={msg.is_pinned ? '取消置顶' : '置顶'}
                            >
                              <Pin className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setReplyingId(msg.id); setReplyContent(msg.reply || ''); }}
                              className="p-1.5 rounded-lg hover:bg-muted"
                              title="回复"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* 内容 */}
                      <p className="text-foreground/90 whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      
                      {/* 博主回复 */}
                      {msg.reply && (
                        <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="w-3 h-3 text-primary" />
                            <span className="text-xs font-medium text-primary">博主回复</span>
                          </div>
                          <p className="text-sm">{msg.reply}</p>
                        </div>
                      )}
                      
                      {/* 回复表单 */}
                      {isAdmin && replyingId === msg.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="输入回复..."
                            className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
                          />
                          <button
                            onClick={() => handleReply(msg.id)}
                            className="px-3 py-2 rounded-lg bg-primary text-white text-sm"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setReplyingId(null); setReplyContent(''); }}
                            className="px-3 py-2 rounded-lg bg-muted text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
