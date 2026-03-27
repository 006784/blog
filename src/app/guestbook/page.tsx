'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Globe,
  Heart,
  Mail,
  MessageCircle,
  Pin,
  RefreshCw,
  Reply,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';

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

export default function GuestbookPage() {
  const { isAdmin } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 表单
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [content, setContent] = useState('');
  
  // 管理员回复
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch('/api/guestbook');
      const data = await res.json();
      if (!res.ok) throw new Error('failed');
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

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
        setNickname('');
        setEmail('');
        setWebsite('');
        setContent('');
        await fetchMessages();
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
          id,
          reply: replyContent,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setReplyingId(null);
        setReplyContent('');
        await fetchMessages();
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
          id,
          is_pinned: !isPinned,
        }),
      });
      await fetchMessages();
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
        body: JSON.stringify({ id }),
      });
      await fetchMessages();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const pinnedCount = useMemo(
    () => messages.filter((message) => message.is_pinned).length,
    [messages]
  );

  return (
    <div className="min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            Guestbook
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                给我留言
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                有什么想说的、想分享的，或者只是路过打个招呼，都欢迎留在这里。
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Messages</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{messages.length}</p>
              </Card>
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Pinned</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{pinnedCount}</p>
              </Card>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Card variant="glass" className="rounded-[var(--radius-2xl)]">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--color-neutral-700)]">昵称</span>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-500)]" />
                    <Input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="昵称 *"
                      required
                      maxLength={50}
                      className="guestbook-field pl-11"
                    />
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--color-neutral-700)]">邮箱</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-500)]" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="邮箱（用于头像）"
                      className="guestbook-field pl-11"
                    />
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--color-neutral-700)]">网站</span>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-500)]" />
                    <Input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="网站（可选）"
                      className="guestbook-field pl-11"
                    />
                  </div>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--color-neutral-700)]">留言内容</span>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="说点什么吧..."
                  required
                  maxLength={1000}
                  rows={5}
                  className="guestbook-field guestbook-textarea resize-none"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                  {content.length}/1000
                </p>
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!nickname.trim() || !content.trim()}
                  className="min-w-[140px]"
                >
                  {!submitting ? <Send className="h-4 w-4" /> : null}
                  发布留言
                </Button>
              </div>
            </div>
          </Card>
        </motion.form>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="glass" className="rounded-[var(--radius-2xl)]">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-32 rounded-full" />
                      <Skeleton className="h-3 w-full rounded-full" />
                      <Skeleton className="h-3 w-2/3 rounded-full" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <StatePanel
              tone="error"
              icon={<RefreshCw className="h-6 w-6" />}
              title="留言列表加载失败"
              description="这次没能获取到留言内容，你可以重新试一次。"
              action={
                <Button onClick={() => void fetchMessages()}>
                  <RefreshCw className="h-4 w-4" />
                  重新加载
                </Button>
              }
            />
          ) : messages.length === 0 ? (
            <StatePanel
              tone="empty"
              title="还没有留言"
              description="留言板刚刚开始，欢迎留下第一条消息。"
            />
          ) : (
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    variant="glass"
                    className={`rounded-[var(--radius-2xl)] ${msg.is_pinned ? 'border-[var(--color-primary-500)]/30 bg-[var(--color-primary-500)]/5' : ''}`}
                  >
                    <div className="flex gap-4">
                      <Image
                        src={msg.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.nickname}`}
                        alt={msg.nickname}
                        width={48}
                        height={48}
                        className="rounded-full bg-[var(--surface-overlay)]"
                      />

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.is_pinned ? <Pin className="h-3.5 w-3.5 text-[var(--color-primary-600)]" /> : null}
                            {msg.website ? (
                              <a
                                href={msg.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base font-semibold text-[var(--color-neutral-900)] transition-colors hover:text-[var(--color-primary-600)]"
                              >
                                {msg.nickname}
                              </a>
                            ) : (
                              <span className="text-base font-semibold text-[var(--color-neutral-900)]">
                                {msg.nickname}
                              </span>
                            )}
                            <Badge variant="soft" className="font-normal">
                              {formatDate(msg.created_at)}
                            </Badge>
                            {msg.is_pinned ? (
                              <Badge tone="info" variant="soft">
                                置顶
                              </Badge>
                            ) : null}
                          </div>

                          {isAdmin ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePin(msg.id, msg.is_pinned)}
                                title={msg.is_pinned ? '取消置顶' : '置顶'}
                              >
                                <Pin className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setReplyingId(msg.id); setReplyContent(msg.reply || ''); }}
                                title="回复"
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(msg.id)}
                                className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>

                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[var(--color-neutral-700)]">
                          {msg.content}
                        </p>

                        {msg.reply ? (
                          <div className="rounded-[var(--radius-xl)] border border-[var(--color-primary-500)]/20 bg-[var(--color-primary-500)]/10 px-4 py-3">
                            <div className="mb-1 flex items-center gap-2">
                              <Heart className="h-3.5 w-3.5 text-[var(--color-primary-600)]" />
                              <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-primary-600)]">
                                博主回复
                              </span>
                            </div>
                            <p className="text-sm leading-7 text-[var(--color-neutral-700)]">{msg.reply}</p>
                          </div>
                        ) : null}

                        {isAdmin && replyingId === msg.id ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              type="text"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="输入回复..."
                              className="guestbook-field flex-1"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleReply(msg.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => { setReplyingId(null); setReplyContent(''); }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
