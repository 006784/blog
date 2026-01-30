'use client';

import { Code2, PenTool, Camera, Music, MessageCircle, ChevronRight, Star, Calendar, Clock, Eye, Heart, User, BookOpen, Github, Twitter, Mail, MapPin, Palette, Coffee, Sparkles, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { BlogCard } from '@/components/BlogCard';
import { AnimatedSection, Floating } from '@/components/Animations';
import { FloatingParticles, GlowOrb } from '@/components/BackgroundEffects';
import { getPageStructuredData } from '@/lib/seo';
import { getPublishedPosts, Post } from '@/lib/supabase';

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

export default function HomePageClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await getPublishedPosts();
      setPosts(data.slice(0, 4));
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  }

  // 转换为 BlogCard 需要的格式
  const formattedPosts = posts.map(post => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.published_at || post.created_at,
    category: post.category,
    tags: post.tags,
    image: post.cover_image || post.image,
    author: post.author,
    readingTime: post.reading_time,
  }));

  // 生成结构化数据
  const websiteSchema = getPageStructuredData('homepage');
  
  return (
    <div className="min-h-screen">
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
      
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
                      <span className="relative z-10 flex items-center gap-2">
                        <PenTool className="w-5 h-5" />
                        浏览文章
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.button>
                  </Link>
                  
                  <Link href="/about">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary group relative px-10 py-5 text-base"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        关于我
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </motion.button>
                  </Link>
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
          <Floating duration={20}>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-[var(--bg-gradient-3)] to-[var(--bg-gradient-4)] rounded-full blur-3xl opacity-20" />
          </Floating>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <AnimatedSection>
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">我的创作领域</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                在不同的维度中探索和分享，每一份热爱都值得被记录
              </p>
            </div>
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
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    <div className="relative z-10">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-16 h-16 rounded-2xl bg-secondary mb-6 flex items-center justify-center"
                      >
                        <feature.icon className={`w-8 h-8 ${feature.gradient.replace('from-', 'text-').replace(' to-', ' ')}`} />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Posts Preview */}
      <section className="py-32 px-6 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">最新文章</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                精选最近发布的文章，带你快速了解我的思考和创作
              </p>
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                  <div className="h-48 bg-secondary rounded-xl mb-6" />
                  <div className="h-6 bg-secondary rounded mb-3" />
                  <div className="h-4 bg-secondary rounded mb-2 w-3/4" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {formattedPosts.map((post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BlogCard post={post} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/blog">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary px-8 py-4 text-lg"
              >
                <span className="flex items-center gap-2">
                  查看所有文章
                  <ChevronRight className="w-5 h-5" />
                </span>
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <AnimatedSection>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">一起拾起时光</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                每一次点击，每一次阅读，都是我们共同编织的美好回忆。
                欢迎订阅我的博客，不错过任何精彩内容。
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/subscribe">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary px-8 py-4 text-lg"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      订阅博客
                    </span>
                  </motion.button>
                </Link>
                
                <Link href="/contact">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary px-8 py-4 text-lg"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      联系我
                    </span>
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}