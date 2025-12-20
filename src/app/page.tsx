'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Code2, Palette, Coffee, ChevronDown, Zap, Heart, Star } from 'lucide-react';
import { BlogCard } from '@/components/BlogCard';
import { AnimatedSection, Floating } from '@/components/Animations';
import { FloatingParticles, GlowOrb } from '@/components/BackgroundEffects';
import { defaultPosts } from '@/lib/types';

const features = [
  {
    icon: Code2,
    title: '技术分享',
    description: '深入浅出的技术文章，涵盖前端、后端、架构设计等领域',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Palette,
    title: '设计思考',
    description: '探索 UI/UX 设计理念，分享创意灵感和设计趋势',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Coffee,
    title: '生活随笔',
    description: '记录生活点滴，分享阅读心得和个人思考',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const stats = [
  { icon: Zap, value: '50+', label: '篇文章', color: 'text-blue-500' },
  { icon: Heart, value: '1000+', label: '读者', color: 'text-pink-500' },
  { icon: Star, value: '99%', label: '好评率', color: 'text-amber-500' },
];

export default function HomePage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Floating particles */}
        <FloatingParticles count={30} />
        
        {/* Subtle glow orbs */}
        <GlowOrb color="var(--bg-gradient-1)" size={400} className="top-10 right-10 opacity-30" />
        <GlowOrb color="var(--bg-gradient-4)" size={300} className="bottom-20 left-10 opacity-20" />

        {/* Content */}
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary/60 backdrop-blur-md rounded-full text-sm text-muted-foreground mb-8 border border-border/50"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-primary" />
                  </motion.div>
                  <span>欢迎来到拾光</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </motion.div>

                {/* Title with shimmer effect */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-6"
                >
                  <span className="block metallic-shimmer">拾起时光</span>
                  <span className="block mt-3 aurora-text">留住美好</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
                >
                  这里是我的<span className="shimmer-text font-medium">数字花园</span>，
                  用文字拾起生活中的点滴微光。
                  <br className="hidden sm:block" />
                  每一篇文章，都是时光里值得珍藏的片段。
                </motion.p>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.45 }}
                  className="flex items-center justify-center gap-8 mb-12"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Buttons - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-5"
                >
                  <Link href="/blog">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary group relative px-10 py-5 text-base"
                    >
                      {/* Animated shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <span className="relative flex items-center gap-3">
                        <Sparkles className="w-5 h-5" />
                        <span>探索文章</span>
                        <motion.div
                          className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                          whileHover={{ rotate: -45 }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </span>
                    </motion.button>
                  </Link>
                  <Link href="/about">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary px-10 py-5 text-base group"
                    >
                      <span className="flex items-center gap-2">
                        了解更多
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                      </span>
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Scroll indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex flex-col items-center gap-2 text-muted-foreground"
                >
                  <span className="text-sm">向下探索</span>
                  <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
                    <motion.div
                      animate={{ y: [0, 12, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <Floating duration={15}>
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] rounded-full blur-3xl opacity-20" />
          </Floating>
          <Floating duration={18}>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-[var(--bg-gradient-3)] to-[var(--bg-gradient-4)] rounded-full blur-3xl opacity-20" />
          </Floating>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection className="text-center mb-20">
            <motion.span 
              className="inline-block text-sm font-medium text-primary mb-4 px-4 py-1.5 bg-primary/10 rounded-full"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              内容分类
            </motion.span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="shimmer-text">多元化内容</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              满足你对知识的渴望，探索无限可能
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94] 
                }}
                whileHover={{ y: -12 }}
                className="group relative"
              >
                {/* Card - Enhanced with rotating border */}
                <div className="relative p-[2px] rounded-[2rem] overflow-hidden h-full">
                  {/* Animated gradient border */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: 'center center' }}
                  />
                  
                  {/* Card inner */}
                  <div className="relative p-8 bg-card rounded-[calc(2rem-2px)] h-full overflow-hidden">
                    {/* Hover background glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                    
                    {/* Mesh gradient on hover */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-7 shadow-xl relative overflow-hidden`}
                      >
                        {/* Icon glow */}
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <feature.icon className="w-9 h-9 text-white relative z-10" />
                        
                        {/* Shine sweep */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full"
                          animate={{ x: ['100%', '-100%'] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                      </motion.div>
                      
                      <h3 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--gradient-start)] group-hover:to-[var(--gradient-end)] transition-all duration-300">
                        {feature.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/70 transition-colors duration-300">
                        {feature.description}
                      </p>
                      
                      {/* Learn more link */}
                      <motion.div 
                        className="mt-6 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        <span>了解更多</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Posts Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-secondary/30" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, var(--bg-gradient-1) 0px, transparent 50%),
            radial-gradient(at 100% 0%, var(--bg-gradient-2) 0px, transparent 50%),
            radial-gradient(at 100% 100%, var(--bg-gradient-3) 0px, transparent 50%),
            radial-gradient(at 0% 100%, var(--bg-gradient-4) 0px, transparent 50%)
          `,
        }} />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <motion.span 
                className="inline-block text-sm font-medium text-primary mb-4 px-4 py-1.5 bg-primary/10 rounded-full"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                最新发布
              </motion.span>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="aurora-text">精选文章</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                探索最新的技术见解和创意灵感
              </p>
            </div>
            <Link href="/blog">
              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 text-primary font-medium px-6 py-3 rounded-full border border-primary/30 hover:bg-primary/10 transition-colors"
              >
                查看全部
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {defaultPosts.slice(0, 4).map((post, index) => (
              <BlogCard 
                key={post.slug} 
                post={post} 
                index={index}
                featured={index === 0}
              />
            ))}
          </div>

          <div className="mt-12 text-center sm:hidden">
            <Link href="/blog">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary"
              >
                查看全部文章
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <FloatingParticles count={20} />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-[2.5rem] p-1 bg-gradient-to-r from-[var(--gradient-start)] via-purple-500 to-[var(--gradient-end)]">
              <div className="relative bg-card rounded-[2.25rem] p-10 sm:p-16">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[var(--gradient-start)]/20 to-transparent rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[var(--gradient-end)]/20 to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
                
                <div className="relative z-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    <span className="rainbow-shimmer">订阅我的博客</span>
                  </h2>
                  <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                    第一时间获取最新文章和独家内容。我承诺不会发送垃圾邮件。
                  </p>
                  
                  <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
                    <div className="flex-1 relative group">
                      <input
                        type="email"
                        placeholder="输入你的邮箱地址"
                        className="w-full px-7 py-5 rounded-2xl bg-secondary/80 backdrop-blur-sm border-2 border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300 text-base"
                      />
                      {/* Glow effect on focus */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="btn-primary px-10 py-5 text-base shadow-2xl shadow-primary/30"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        立即订阅
                      </span>
                    </motion.button>
                  </form>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
