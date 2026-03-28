'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ArrowRight,
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
  Palette,
  Twitter,
} from 'lucide-react';
import { useProfile } from '@/components/ProfileProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const skills = [
  { name: 'React', level: 95, summary: '复杂交互、状态管理与组件抽象' },
  { name: 'TypeScript', level: 90, summary: '类型建模、接口设计与重构安全性' },
  { name: 'Next.js', level: 88, summary: '内容站点、全栈接口与渲染策略' },
  { name: 'Node.js', level: 85, summary: 'API 设计、数据处理与服务整合' },
  { name: 'Tailwind CSS', level: 92, summary: '设计系统落地与视觉统一' },
  { name: 'Python', level: 75, summary: '脚本自动化与数据工具辅助' },
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
  {
    icon: Code2,
    label: '编程',
    description: '喜欢把复杂问题拆开，再做成顺手好用的产品。',
  },
  {
    icon: Palette,
    label: '设计',
    description: '关注排版、节奏和细节，希望页面既清晰也耐看。',
  },
  {
    icon: Coffee,
    label: '咖啡',
    description: '一杯热咖啡，通常是一个想法开始落地的信号。',
  },
  {
    icon: Music,
    label: '音乐',
    description: '写代码和写文章时，音乐总能把状态慢慢拉回来。',
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
    { label: '核心技能', value: `${skills.length}+` },
    { label: '成长阶段', value: `${experiences.length} 段` },
    { label: '关注方向', value: `${interests.length} 类` },
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
        <div className="absolute bottom-0 right-[10%] h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--surface-overlay)_0%,transparent_70%)] opacity-70 blur-3xl" />
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
            className="overflow-hidden border-[color:var(--border-strong)]"
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

            <div className="space-y-5">
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--color-neutral-900)] sm:text-5xl">
                  你好，我是
                  <span className="ml-3 bg-[linear-gradient(120deg,var(--color-primary-600),var(--color-primary-900))] bg-clip-text text-transparent">
                    {profile.nickname}
                  </span>
                </h1>
                <p className="max-w-2xl text-[var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                  {profile.bio ||
                    '一名热爱技术和设计的全栈开发者，专注于创建美观、高性能的 Web 应用。'}
                </p>
              </div>

              <Card
                variant="bordered"
                className="rounded-[var(--radius-2xl)] bg-[linear-gradient(135deg,var(--surface-raised),var(--surface-base))]"
              >
                <p className="text-sm font-medium tracking-[0.16em] text-[var(--color-primary-700)]">
                  个人宣言
                </p>
                <p className="mt-3 text-[var(--text-lg)] leading-[var(--leading-relaxed)] text-[var(--color-neutral-700)]">
                  {profile.motto || '用代码编织梦想，用文字记录时光。'}
                </p>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlightStats.map((item) => (
                  <Card
                    key={item.label}
                    variant="bordered"
                    padding="sm"
                    className="rounded-[var(--radius-xl)] bg-[var(--surface-base)]"
                  >
                    <p className="text-sm text-[var(--color-neutral-500)]">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">
                      {item.value}
                    </p>
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
              className="relative overflow-hidden border-[color:var(--border-strong)]"
            >
              <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,var(--color-primary-100),transparent)] opacity-80" />
              <div className="relative grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
                <div className="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-[calc(var(--radius-2xl)+4px)] border border-[color:var(--border-strong)] bg-[var(--surface-overlay)] shadow-[var(--shadow-lg)]">
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
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,var(--surface-overlay),var(--surface-base))] text-6xl font-semibold text-[var(--color-primary-700)]">
                      {profile.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium tracking-[0.18em] text-[var(--color-primary-700)]">
                      当前状态
                    </p>
                    <h2 className="text-2xl font-semibold text-[var(--color-neutral-900)]">
                      保持创作，也保持好奇
                    </h2>
                    <p className="text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                      这里记录我的技术栈、成长经历和日常偏好，也希望让你更快理解这个站点背后的气质。
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {profileHighlights.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-3"
                      >
                        <div className="flex items-center gap-2 text-sm text-[var(--color-neutral-500)]">
                          <item.icon className="h-4 w-4 text-[var(--color-primary-600)]" />
                          {item.label}
                        </div>
                        <p className="mt-2 text-base font-medium text-[var(--color-neutral-900)]">
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
                          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-default)] bg-[var(--surface-base)] px-4 py-2 text-sm font-medium text-[var(--color-neutral-700)] transition-colors hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)]"
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
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <Badge variant="soft" className="mb-3 px-3 py-1.5">
                  Core Skills
                </Badge>
                <h2 className="text-3xl font-semibold text-[var(--color-neutral-900)]">
                  技能专长
                </h2>
                <p className="mt-2 text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                  主要聚焦现代 Web 技术栈，也持续把设计系统、体验细节和工程质量一起往前推。
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-[var(--color-neutral-900)]">
                        {skill.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
                        {skill.summary}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 px-3 py-1.5">
                      {skill.level}%
                    </Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-overlay)]">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.8, delay: index * 0.06 }}
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary-500),var(--color-primary-700))]"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          <Card variant="glass" padding="lg">
            <Badge variant="soft" className="mb-3 px-3 py-1.5">
              Life
            </Badge>
            <h2 className="text-3xl font-semibold text-[var(--color-neutral-900)]">
              兴趣爱好
            </h2>
            <p className="mt-2 text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
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
                    className="h-full rounded-[var(--radius-2xl)] bg-[var(--surface-base)]"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-primary-100),var(--surface-overlay))] text-[var(--color-primary-700)]">
                      <interest.icon className="h-5 w-5" />
                    </div>
                    <p className="text-lg font-semibold text-[var(--color-neutral-900)]">
                      {interest.label}
                    </p>
                    <p className="mt-2 text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                      {interest.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </section>

        <section>
          <Card variant="default" padding="lg">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="soft" className="mb-3 px-3 py-1.5">
                  Timeline
                </Badge>
                <h2 className="text-3xl font-semibold text-[var(--color-neutral-900)]">
                  工作经历
                </h2>
                <p className="mt-2 text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                  从执行项目，到搭建系统，再到开始关注产品气质和整体体验。
                </p>
              </div>
              <Badge variant="outline" className="px-3 py-1.5">
                持续成长中
              </Badge>
            </div>

            <div className="grid gap-4">
              {experiences.map((experience, index) => (
                <motion.div
                  key={experience.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card
                    variant="bordered"
                    padding="md"
                    className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[linear-gradient(180deg,var(--surface-base),var(--surface-panel))]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <Badge variant="soft" className="px-3 py-1.5">
                          {experience.period}
                        </Badge>
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--color-neutral-900)]">
                            {experience.title}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-[var(--color-primary-700)]">
                            {experience.company}
                          </p>
                        </div>
                      </div>
                      <div className="max-w-2xl text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                        {experience.description}
                      </div>
                    </div>
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
            className="overflow-hidden border-[color:var(--border-strong)]"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="soft" className="mb-3 px-3 py-1.5">
                  Connect
                </Badge>
                <h2 className="text-3xl font-semibold text-[var(--color-neutral-900)]">
                  让我们一起创造精彩
                </h2>
                <p className="mt-3 text-sm leading-[var(--leading-relaxed)] text-[var(--color-neutral-600)]">
                  如果你想聊项目合作、站点设计、内容系统，或者只是想打个招呼，都欢迎来联系我。
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
                  看成长时间线
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
