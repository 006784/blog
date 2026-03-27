'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Check,
  Github,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Twitter,
} from 'lucide-react';
import { AnimatedSection } from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createContactMessage } from '@/lib/supabase';

const contactInfo = [
  {
    icon: Mail,
    label: '邮箱',
    value: 'zyi408480@gmail.com',
    href: 'mailto:zyi408480@gmail.com',
    color: 'bg-[var(--ink)]',
  },
  {
    icon: MapPin,
    label: '地点',
    value: '上海，中国',
    href: '#',
    color: 'bg-[var(--ink-secondary)]',
  },
  {
    icon: Phone,
    label: '电话',
    value: '+86 123 4567 8900',
    href: 'tel:+8612345678900',
    color: 'bg-[var(--gold)]',
  },
];

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com', icon: Github, color: 'hover:bg-[var(--ink)] hover:text-[var(--paper)]' },
  { name: 'Twitter', href: 'https://twitter.com', icon: Twitter, color: 'hover:bg-[var(--ink)] hover:text-[var(--paper)]' },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin, color: 'hover:bg-[var(--ink)] hover:text-[var(--paper)]' },
  { name: 'WeChat', href: '#', icon: MessageCircle, color: 'hover:bg-[var(--gold)] hover:text-[var(--paper)]' },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createContactMessage({
        name: formState.name,
        email: formState.email,
        subject: formState.subject,
        message: formState.message,
      });

      setIsSubmitted(true);

      // Reset after showing success
      setTimeout(() => {
        setIsSubmitted(false);
        setFormState({ name: '', email: '', subject: '', message: '' });
      }, 3000);
    } catch (err) {
      console.error('发送失败:', err);
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen px-6 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <AnimatedSection>
          <div className="space-y-5">
            <Badge tone="info" variant="soft" className="w-fit gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              Contact
            </Badge>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                  保持联系
                </h1>
                <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                  如果你想讨论合作、交流想法，或者只是想打个招呼，都欢迎通过这页联系我。
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
                <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Response</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">24h</p>
                </Card>
                <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Timezone</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">UTC+8</p>
                </Card>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <section className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-2">
            <AnimatedSection>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Contact Info</p>
                  <h2 className="text-2xl font-semibold text-[var(--color-neutral-900)]">联系方式</h2>
                </div>
                {contactInfo.map((info, index) => (
                  <motion.a
                    key={info.label}
                    href={info.href}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ x: 4 }}
                    className="block"
                  >
                    <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] text-white ${info.color}`}>
                          <info.icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-[var(--color-neutral-500)]">{info.label}</p>
                          <p className="font-medium text-[var(--color-neutral-900)]">{info.value}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.a>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Social</p>
                  <h2 className="text-2xl font-semibold text-[var(--color-neutral-900)]">社交媒体</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ y: -2 }}
                      className="block"
                    >
                      <Card
                        variant="glass"
                        padding="sm"
                        className="flex h-14 w-14 items-center justify-center rounded-full p-0 transition hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]"
                      >
                        <social.icon className="h-5 w-5" />
                      </Card>
                    </motion.a>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <Card variant="glass" className="rounded-[var(--radius-2xl)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-500)]/12 text-[var(--color-primary-600)]">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-[var(--color-neutral-900)]">快速响应</h3>
                    <p className="text-sm leading-6 text-[var(--color-neutral-600)]">
                      我通常会在 24 小时内回复。紧急事项可以优先通过社交媒体联系。
                    </p>
                  </div>
                </div>
              </Card>
            </AnimatedSection>
          </div>

          <div className="lg:col-span-3">
            <AnimatedSection delay={0.05}>
              <Card variant="glass" className="rounded-[var(--radius-2xl)]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Message Form</p>
                    <h2 className="text-2xl font-semibold text-[var(--color-neutral-900)]">发送消息</h2>
                  </div>

                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="py-14 text-center"
                      >
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-lg)]">
                          <Check className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-semibold text-[var(--color-neutral-900)]">消息已发送</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-neutral-600)]">
                          感谢你的来信，我会尽快回复你。
                        </p>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                      >
                        <div className="grid gap-5 sm:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-[var(--color-neutral-700)]">姓名</span>
                            <Input
                              type="text"
                              name="name"
                              value={formState.name}
                              onChange={handleChange}
                              required
                              placeholder="你的名字"
                            />
                          </label>
                          <label className="space-y-2">
                            <span className="text-sm font-medium text-[var(--color-neutral-700)]">邮箱</span>
                            <Input
                              type="email"
                              name="email"
                              value={formState.email}
                              onChange={handleChange}
                              required
                              placeholder="you@example.com"
                            />
                          </label>
                        </div>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--color-neutral-700)]">主题</span>
                          <Input
                            type="text"
                            name="subject"
                            value={formState.subject}
                            onChange={handleChange}
                            required
                            placeholder="想聊什么？"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--color-neutral-700)]">消息内容</span>
                          <Textarea
                            name="message"
                            value={formState.message}
                            onChange={handleChange}
                            required
                            rows={7}
                            placeholder="写下你的想法、合作需求或想问的问题..."
                            className="resize-none"
                          />
                        </label>

                        {error ? (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 rounded-[var(--radius-xl)] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-500"
                          >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                          </motion.div>
                        ) : null}

                        <Button type="submit" loading={isSubmitting} className="w-full">
                          {!isSubmitting ? <Send className="h-4 w-4" /> : null}
                          发送消息
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </AnimatedSection>
          </div>
        </section>

        <AnimatedSection delay={0.15}>
          <Card variant="glass" className="relative min-h-[320px] overflow-hidden rounded-[var(--radius-2xl)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border-default)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-overlay)]/80 via-transparent to-[var(--surface-raised)]/80" />
            <div className="relative flex h-full min-h-[320px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-500)]/12 text-[var(--color-primary-600)]">
                  <MapPin className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold text-[var(--color-neutral-900)]">上海，中国</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-neutral-600)]">
                  期待在某个项目、某次交流，或者生活的交叉点与你相遇。
                </p>
              </div>
            </div>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  );
}
