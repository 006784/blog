'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Code2,
  Coffee,
  Github,
  Globe,
  GraduationCap,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Music,
  Network,
  Palette,
  Twitter,
  Zap,
} from 'lucide-react';
import { useProfile } from '@/components/ProfileProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const focusAreas = [
  {
    icon: Bot,
    label: 'AI 编程工具',
    description: 'Claude Code、Cursor、MCP 等 AI 辅助开发工具的实测体验与效率对比。',
    color: 'var(--color-primary-500)',
  },
  {
    icon: Code2,
    label: 'Web 全栈开发',
    description: 'Next.js、TypeScript 与个人项目从搭建到上线的踩坑记录。',
    color: 'var(--color-orange-500)',
  },
  {
    icon: Network,
    label: '计算机基础',
    description: '网络协议、密码学这些"用得到但说不清"的底层知识梳理。',
    color: 'var(--color-teal-500)',
  },
  {
    icon: Zap,
    label: '效率与工具',
    description: '把繁琐的事交给脚本和自动化，省下时间写点别的。',
    color: 'var(--color-smoke-blue-400)',
  },
];

const interests = [
  {
    icon: Code2,
    label: '编程',
    description: '喜欢把复杂问题拆开，再做成顺手好用的产品。',
    color: 'var(--color-orange-500)',
  },
  {
    icon: Palette,
    label: '设计',
    description: '关注排版、节奏和细节，希望页面既清晰也耐看。',
    color: 'var(--color-smoke-blue-400)',
  },
  {
    icon: Coffee,
    label: '咖啡',
    description: '一杯热咖啡，通常是一个想法开始落地的信号。',
    color: 'var(--color-primary-500)',
  },
  {
    icon: Music,
    label: '音乐',
    description: '写代码和写文章时，音乐总能把状态慢慢拉回来。',
    color: 'var(--color-orange-500)',
  },
];

export default function AboutPage() {
  const { profile } = useProfile();

  const socialLinks = [
    profile.github
      ? { name: 'GitHub', href: profile.github, icon: Github }
      : null,
    profile.twitter
      ? { name: 'Twitter', href: profile.twitter, icon: Twitter }
      : null,
    profile.linkedin
      ? { name: 'LinkedIn', href: profile.linkedin, icon: Linkedin }
      : null,
    profile.website
      ? { name: 'Website', href: profile.website, icon: Globe }
      : null,
    profile.email
      ? { name: 'Email', href: `mailto:${profile.email}`, icon: Mail }
      : null,
  ].filter(Boolean) as Array<{
    name: string;
    href: string;
    icon: typeof Github;
  }>;

  const highlightStats = [
    { label: '技术方向', value: `${focusAreas.length} 个`, icon: Code2, color: 'var(--color-orange-500)' },
    { label: '生活兴趣', value: `${interests.length} 类`, icon: Heart, color: 'var(--color-primary-500)' },
  ];

  const profileHighlights = [
    profile.location
      ? {
          label: '所在城市',
          value: profile.location,
          icon: MapPin,
        }
      : null,
    profile.occupation
      ? {
          label: '当前身份',
          value: profile.occupation,
          icon: Briefcase,
        }
      : null,
    {
      label: '学习背景',
      value: '计算机科学学士',
      icon: GraduationCap,
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: typeof MapPin;
  }>;

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-primary-200)_0%,transparent_72%)] opacity-35 blur-3xl" />
        <div className="absolute bottom-0 right-[10%] h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--color-smoke-blue-100)_0%,transparent_70%)] opacity-50 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <Card
            variant="glass"
            padding="lg"
            className="overflow-hidden border-(--border-strong)"
          >
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge variant="soft" className="gap-1.5 px-3 py-1.5">
                <Heart className="h-3.5 w-3.5" />
                关于我
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5">
                {profile.signature || '探索 · 记录 · 分享'}
              </Badge>
            </div>

            <p className="about-id-strip" aria-hidden="true">
              <span>ID // {(profile.nickname || 'LUMEN').toUpperCase()}</span>
              <span>{profile.occupation || 'BUILDER'}</span>
              {profile.location && <span>LOC. {profile.location}</span>}
              <span>STATUS · Available</span>
            </p>

            <div className="space-y-5">
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-5xl">
                  你好，我是
                  <span className="ml-3 bg-[linear-gradient(120deg,var(--color-primary-600),var(--color-primary-900))] bg-clip-text text-transparent">
                    {profile.nickname}
                  </span>
                </h1>
                <p className="max-w-2xl text-(--text-lg) leading-(--leading-relaxed) text-neutral-600">
                  {profile.bio ||
                    '一名热爱技术和设计的全栈开发者，专注于创建美观、高性能的 Web 应用。'}
                </p>
              </div>

              <Card
                variant="bordered"
                className="rounded-2xl bg-[linear-gradient(135deg,var(--surface-raised),var(--surface-base))]"
              >
                <p className="text-sm font-medium tracking-[0.16em] text-(--color-primary-700)">
                  个人宣言
                </p>
                <p className="mt-3 text-(--text-lg) leading-(--leading-relaxed) text-neutral-700">
                  {profile.motto || '用代码编织梦想，用文字记录时光。'}
                </p>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                {highlightStats.map((item) => (
                  <Card
                    key={item.label}
                    variant="bordered"
                    padding="sm"
                    className="rounded-xl bg-(--surface-base)"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: `color-mix(in srgb, ${item.color} 15%, transparent)`,
                          color: item.color,
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-semibold text-neutral-900">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => window.location.assign('/contact')}>
                  联系我
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.assign('/blog')}
                >
                  看看最近写了什么
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-6">
            <Card
              variant="elevated"
              padding="lg"
              className="relative overflow-hidden border-(--border-strong)"
            >
              <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,var(--color-primary-100),transparent)] opacity-80" />
              <div className="relative grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
                <div className="mx-auto aspect-square w-full max-w-40 sm:max-w-50 overflow-hidden rounded-[calc(var(--radius-2xl)+4px)] border border-(--border-strong) bg-(--surface-overlay) shadow-(--shadow-lg)">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={`${profile.nickname} 的头像`}
                      width={440}
                      height={440}
                      className="h-full w-full object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,var(--surface-overlay),var(--surface-base))] text-6xl font-semibold text-(--color-primary-700)">
                      {profile.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium tracking-[0.18em] text-(--color-primary-700)">
                      当前状态
                    </p>
                    <h2 className="text-2xl font-semibold text-neutral-900">
                      保持创作，也保持好奇
                    </h2>
                    <p className="text-sm leading-(--leading-relaxed) text-neutral-600">
                      这里记录我的技术栈、成长经历和日常偏好，也希望让你更快理解这个站点背后的气质。
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {profileHighlights.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-(--border-default) bg-(--surface-panel) px-4 py-3"
                      >
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <item.icon className="h-4 w-4 text-(--color-primary-600)" />
                          {item.label}
                        </div>
                        <p className="mt-2 text-base font-medium text-neutral-900">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {socialLinks.map((social) => (
                        <motion.a
                          key={social.name}
                          href={social.href}
                          target={social.name === 'Email' ? undefined : '_blank'}
                          rel={social.name === 'Email' ? undefined : 'noopener noreferrer'}
                          whileHover={{ y: -2 }}
                          className="inline-flex items-center gap-2 rounded-full border border-(--border-default) bg-(--surface-base) px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-(--color-primary-500) hover:text-(--color-primary-700)"
                        >
                          <social.icon className="h-4 w-4" />
                          {social.name}
                        </motion.a>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="px-3 py-1.5">
                      社交链接稍后补充
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card variant="default" padding="lg">
            <Badge variant="soft" className="mb-3 px-3 py-1.5">
              Focus
            </Badge>
            <h2 className="text-3xl font-semibold text-neutral-900">
              关注领域
            </h2>
            <p className="mt-2 text-sm leading-(--leading-relaxed) text-neutral-600">
              博客里大部分内容都围绕这几个方向展开，边写边学，记录过程比给出结论更重要。
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {focusAreas.map((area, index) => (
                <motion.div
                  key={area.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <Card
                    variant="bordered"
                    padding="sm"
                    className="h-full rounded-2xl bg-(--surface-base)"
                  >
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: `color-mix(in srgb, ${area.color} 15%, transparent)`,
                        color: area.color,
                      }}
                    >
                      <area.icon className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-semibold text-neutral-900">
                      {area.label}
                    </p>
                    <p className="mt-2 text-sm leading-(--leading-relaxed) text-neutral-600">
                      {area.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>

          <Card variant="glass" padding="lg">
            <Badge variant="soft" className="mb-3 px-3 py-1.5">
              Life
            </Badge>
            <h2 className="text-3xl font-semibold text-neutral-900">
              兴趣爱好
            </h2>
            <p className="mt-2 text-sm leading-(--leading-relaxed) text-neutral-600">
              工作之外，我也希望生活保持层次感，这些兴趣会直接反过来影响产品审美和表达方式。
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {interests.map((interest, index) => (
                <motion.div
                  key={interest.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card
                    variant="bordered"
                    padding="sm"
                    className="h-full rounded-2xl bg-(--surface-base)"
                  >
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: `color-mix(in srgb, ${interest.color} 15%, transparent)`,
                        color: interest.color,
                      }}
                    >
                      <interest.icon className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-semibold text-neutral-900">
                      {interest.label}
                    </p>
                    <p className="mt-2 text-sm leading-(--leading-relaxed) text-neutral-600">
                      {interest.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <Card
            variant="glass"
            padding="lg"
            className="overflow-hidden border-(--border-strong)"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="soft" className="mb-3 px-3 py-1.5">
                  Connect
                </Badge>
                <h2 className="text-3xl font-semibold text-neutral-900">
                  一起交流，一起记录
                </h2>
                <p className="mt-3 text-sm leading-(--leading-relaxed) text-neutral-600">
                  如果你也在关注 AI 编程、Web 开发，或者只是想打个招呼，都欢迎来聊聊。
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => window.location.assign('/contact')}>
                  进入联系页
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.assign('/timeline')}
                >
                  看 AI 时间线
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
