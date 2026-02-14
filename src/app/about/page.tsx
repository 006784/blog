'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Github, Twitter, Mail, MapPin, Briefcase, GraduationCap, Heart, Code2, Palette, Coffee, Music } from 'lucide-react';
import { AnimatedSection, Floating } from '@/components/Animations';
import { useProfile } from '@/components/ProfileProvider';

const skills = [
  { name: 'React', level: 95 },
  { name: 'TypeScript', level: 90 },
  { name: 'Next.js', level: 88 },
  { name: 'Node.js', level: 85 },
  { name: 'Tailwind CSS', level: 92 },
  { name: 'Python', level: 75 },
];

const experiences = [
  {
    title: '高级前端工程师',
    company: 'Tech Company',
    period: '2022 - 至今',
    description: '负责核心产品的前端架构设计和开发，带领团队完成多个重要项目。',
  },
  {
    title: '前端工程师',
    company: 'Startup Inc',
    period: '2020 - 2022',
    description: '从零开始构建公司的主要产品，优化性能提升了 40% 的加载速度。',
  },
  {
    title: '初级开发者',
    company: 'Agency Co',
    period: '2018 - 2020',
    description: '参与多个客户项目的开发，学习和成长。',
  },
];

const interests = [
  { icon: Code2, label: '编程', color: 'bg-blue-500' },
  { icon: Palette, label: '设计', color: 'bg-purple-500' },
  { icon: Coffee, label: '咖啡', color: 'bg-amber-500' },
  { icon: Music, label: '音乐', color: 'bg-green-500' },
];

export default function AboutPage() {
  const { profile } = useProfile();
  
  const socialLinks = [
    { name: 'GitHub', href: profile.github || 'https://github.com', icon: Github },
    { name: 'Twitter', href: profile.twitter || 'https://twitter.com', icon: Twitter },
    { name: 'Email', href: `mailto:${profile.email || 'hello@example.com'}`, icon: Mail },
  ];
  
  return (
    <div className="min-h-screen pb-14">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-[var(--bg-gradient-3)] to-[var(--bg-gradient-4)] rounded-full blur-3xl opacity-15" />
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background to-background" />
        <Floating duration={10}>
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-r from-[var(--gradient-start)]/20 to-[var(--gradient-end)]/20 rounded-full blur-3xl" />
        </Floating>
        <Floating duration={15}>
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-r from-[var(--bg-gradient-4)]/30 to-[var(--bg-gradient-3)]/30 rounded-full blur-3xl" />
        </Floating>

        <div className="relative max-w-6xl mx-auto">
          <div className="surface-hero grid lg:grid-cols-2 gap-12 items-center p-7 sm:p-12">
            {/* Image */}
            <AnimatedSection>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative aspect-square max-w-md mx-auto lg:max-w-none"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-3xl rotate-6 opacity-20" />
                <div className="relative aspect-square rounded-3xl overflow-hidden border border-[var(--ui-line)] shadow-[var(--ui-shadow-soft)]">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar}
                      alt="个人头像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
                      <span className="text-6xl font-bold text-white">{profile.nickname.charAt(0)}</span>
                    </div>
                  )}
                </div>
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="surface-card absolute -top-4 -right-4 px-4 py-2 rounded-xl"
                >
                  <span className="text-2xl">👋</span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="surface-card absolute -bottom-4 -left-4 px-4 py-2 rounded-xl"
                >
                  <span className="text-sm font-medium">5+ 年经验</span>
                </motion.div>
              </motion.div>
            </AnimatedSection>

            {/* Content */}
            <AnimatedSection delay={0.2}>
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="section-kicker mb-6"
                >
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  开放合作机会
                </motion.div>

                <h1 className="apple-display mb-6">
                  你好，我是 <span className="aurora-text">{profile.nickname}</span>
                </h1>

                <p className="text-lg text-soft mb-6 leading-relaxed">
                  {profile.bio || '一名热爱技术和设计的全栈开发者，专注于创建美观、高性能的 Web 应用。我相信优秀的产品来源于对细节的追求和对用户体验的深刻理解。'}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  {profile.location && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-line)] bg-secondary/35 px-3 py-1.5 text-sm text-soft">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  )}
                  {profile.occupation && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-line)] bg-secondary/35 px-3 py-1.5 text-sm text-soft">
                      <Briefcase className="w-4 h-4" />
                      {profile.occupation}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-line)] bg-secondary/35 px-3 py-1.5 text-sm text-soft">
                    <GraduationCap className="w-4 h-4" />
                    计算机科学学士
                  </span>
                </div>

                {/* Social Links */}
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -3 }}
                      whileTap={{ scale: 0.9 }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ui-line)] bg-card/80 text-soft transition hover:border-primary hover:text-primary"
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="section-kicker mb-4">Core Skills</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">技能专长</h2>
            <p className="text-soft max-w-lg mx-auto">
              我专注于现代 Web 技术栈，持续学习和探索新技术
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="surface-card p-5 interactive-card"
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-soft">{skill.level}%</span>
                </div>
                <div className="h-3 bg-secondary/45 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="h-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="section-kicker mb-4">Timeline</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">工作经历</h2>
            <p className="text-soft max-w-lg mx-auto">
              从初级开发者到技术负责人的成长之路
            </p>
          </AnimatedSection>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-[var(--ui-line)] md:-translate-x-1/2" />

            {experiences.map((exp, index) => (
              <motion.div
                key={exp.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative flex flex-col md:flex-row gap-8 mb-12 ${
                  index % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Dot */}
                <div className="absolute left-0 md:left-1/2 w-4 h-4 bg-primary rounded-full md:-translate-x-1/2 -translate-y-0.5" />

                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'} pl-8 md:pl-0`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="surface-card interactive-card p-6"
                  >
                    <span className="text-sm text-primary font-medium">
                      {exp.period}
                    </span>
                    <h3 className="text-xl font-semibold mt-1 mb-2">
                      {exp.title}
                    </h3>
                    <p className="text-soft text-sm mb-2">
                      {exp.company}
                    </p>
                    <p className="text-soft">
                      {exp.description}
                    </p>
                  </motion.div>
                </div>

                {/* Spacer */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interests Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="section-kicker mb-4">Life</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">兴趣爱好</h2>
            <p className="text-soft max-w-lg mx-auto">
              工作之外，我也热爱生活
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {interests.map((interest, index) => (
              <motion.div
                key={interest.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="surface-card interactive-card p-6 text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  className={`w-16 h-16 ${interest.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                >
                  <interest.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="font-semibold">{interest.label}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="surface-hero relative overflow-hidden text-center p-12">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--gradient-start)]/25 via-transparent to-[var(--gradient-end)]/30" />
              <Heart className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="relative text-3xl sm:text-4xl font-bold mb-4">
                让我们一起创造精彩
              </h2>
              <p className="relative text-soft mb-8 max-w-lg mx-auto">
                无论是项目合作、技术交流还是单纯的聊天，我都很期待与你连接
              </p>
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary px-8 py-4"
                >
                  联系我
                </motion.button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
