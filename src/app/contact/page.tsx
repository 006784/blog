'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, MapPin, Phone, Github, Twitter, Linkedin, MessageCircle, Check, Loader2, AlertCircle } from 'lucide-react';
import { AnimatedSection, Floating } from '@/components/Animations';
import { createContactMessage } from '@/lib/supabase';
import clsx from 'clsx';

const contactInfo = [
  {
    icon: Mail,
    label: '邮箱',
    value: 'zyi408480@gmail.com',
    href: 'mailto:zyi408480@gmail.com',
    color: 'bg-blue-500',
  },
  {
    icon: MapPin,
    label: '地点',
    value: '上海，中国',
    href: '#',
    color: 'bg-green-500',
  },
  {
    icon: Phone,
    label: '电话',
    value: '+86 123 4567 8900',
    href: 'tel:+8612345678900',
    color: 'bg-purple-500',
  },
];

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com', icon: Github, color: 'hover:bg-gray-800 hover:text-white' },
  { name: 'Twitter', href: 'https://twitter.com', icon: Twitter, color: 'hover:bg-blue-500 hover:text-white' },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin, color: 'hover:bg-blue-600 hover:text-white' },
  { name: 'WeChat', href: '#', icon: MessageCircle, color: 'hover:bg-green-500 hover:text-white' },
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error('发送失败:', err);
      setError(err.message || '发送失败，请稍后重试');
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
    <div className="min-h-screen pb-14">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-r from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-[var(--bg-gradient-3)] to-[var(--bg-gradient-4)] rounded-full blur-3xl opacity-15" />
      </div>

      {/* Header */}
      <section className="relative px-6 pt-24 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-background" />
        <Floating duration={10}>
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[var(--gradient-start)]/20 to-[var(--gradient-end)]/20 rounded-full blur-3xl" />
        </Floating>
        <Floating duration={12}>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-full blur-3xl" />
        </Floating>

        <div className="relative max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="surface-hero p-8 sm:p-12 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="section-kicker mb-6"
              >
                <Mail className="w-4 h-4" />
                随时欢迎联系
              </motion.div>

              <h1 className="apple-display mb-6">
                让我们 <span className="rainbow-shimmer">保持联系</span>
              </h1>

              <p className="text-lg text-soft max-w-2xl mx-auto">
                无论你是想讨论项目合作、交流技术想法，还是只是想打个招呼，
                我都很期待收到你的消息！
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <AnimatedSection>
                <span className="section-kicker mb-4">Contact</span>
                <h2 className="text-2xl font-bold mb-6">联系方式</h2>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <motion.a
                      key={info.label}
                      href={info.href}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="surface-card interactive-card flex items-center gap-4 p-4 group"
                    >
                      <div className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center text-white`}>
                        <info.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.label}</p>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {info.value}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </AnimatedSection>

              {/* Social Links */}
              <AnimatedSection delay={0.2}>
                <span className="section-kicker mb-4">Social</span>
                <h2 className="text-2xl font-bold mb-6">社交媒体</h2>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 rounded-full border border-[var(--ui-line)] bg-card/80 flex items-center justify-center text-soft transition-all ${social.color}`}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </AnimatedSection>

              {/* Quick response note */}
              <AnimatedSection delay={0.3}>
                <div className="surface-card p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">快速响应</h3>
                      <p className="text-sm text-muted-foreground">
                        我通常会在 24 小时内回复邮件。对于紧急事项，欢迎通过社交媒体联系我。
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <AnimatedSection delay={0.1}>
                  <div className="surface-card relative p-8 sm:p-10">
                    <h2 className="text-2xl font-bold mb-8 aurora-text">发送消息</h2>

                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="py-20 text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                          <Check className="w-10 h-10 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-2">消息已发送！</h3>
                        <p className="text-muted-foreground">
                          感谢你的联系，我会尽快回复你。
                        </p>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                      >
                        <div className="grid sm:grid-cols-2 gap-6">
                          {/* Name */}
                          <div className="relative">
                            <label
                              htmlFor="name"
                              className={clsx(
                                'absolute left-4 transition-all duration-200 pointer-events-none',
                                focusedField === 'name' || formState.name
                                  ? '-top-2.5 text-xs bg-[var(--ui-panel-strong)] px-2 text-primary'
                                  : 'top-4 text-soft'
                              )}
                            >
                              姓名
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formState.name}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('name')}
                              onBlur={() => setFocusedField(null)}
                              required
                              className="input-modern w-full px-5 py-4"
                            />
                          </div>

                          {/* Email */}
                          <div className="relative">
                            <label
                              htmlFor="email"
                              className={clsx(
                                'absolute left-4 transition-all duration-200 pointer-events-none',
                                focusedField === 'email' || formState.email
                                  ? '-top-2.5 text-xs bg-[var(--ui-panel-strong)] px-2 text-primary'
                                  : 'top-4 text-soft'
                              )}
                            >
                              邮箱
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formState.email}
                              onChange={handleChange}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              required
                              className="input-modern w-full px-5 py-4"
                            />
                          </div>
                        </div>

                        {/* Subject */}
                        <div className="relative">
                          <label
                            htmlFor="subject"
                            className={clsx(
                              'absolute left-4 transition-all duration-200 pointer-events-none',
                              focusedField === 'subject' || formState.subject
                                ? '-top-2.5 text-xs bg-[var(--ui-panel-strong)] px-2 text-primary'
                                : 'top-4 text-soft'
                            )}
                          >
                            主题
                          </label>
                          <input
                            type="text"
                            id="subject"
                            name="subject"
                            value={formState.subject}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('subject')}
                            onBlur={() => setFocusedField(null)}
                            required
                            className="input-modern w-full px-5 py-4"
                          />
                        </div>

                        {/* Message */}
                        <div className="relative">
                          <label
                            htmlFor="message"
                            className={clsx(
                              'absolute left-4 transition-all duration-200 pointer-events-none',
                              focusedField === 'message' || formState.message
                                ? '-top-2.5 text-xs bg-[var(--ui-panel-strong)] px-2 text-primary'
                                : 'top-4 text-soft'
                            )}
                          >
                            消息内容
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            value={formState.message}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('message')}
                            onBlur={() => setFocusedField(null)}
                            required
                            rows={6}
                            className="input-modern w-full px-5 py-4 resize-none"
                          />
                        </div>

                        {/* Error Message */}
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-4 bg-red-500/10 text-red-500 rounded-xl"
                          >
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                          </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.button
                          type="submit"
                          disabled={isSubmitting}
                          whileHover={{ scale: isSubmitting ? 1 : 1.03, y: isSubmitting ? 0 : -3 }}
                          whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                          className={clsx(
                            'w-full py-5 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all text-base',
                            isSubmitting
                              ? 'bg-primary/50 cursor-not-allowed text-white'
                              : 'btn-primary'
                          )}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              发送中...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              发送消息
                            </>
                          )}
                        </motion.button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Map placeholder */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="surface-card relative h-[400px] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">上海，中国</h3>
                  <p className="text-muted-foreground">
                    期待与你在这里相遇
                  </p>
                </div>
              </div>
              {/* Decorative dots */}
              <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
