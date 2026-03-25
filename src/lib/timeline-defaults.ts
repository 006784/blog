import type { TimelineEvent } from './supabase';

export const DEFAULT_TIMELINE_EVENTS: Array<
  Pick<TimelineEvent, 'title' | 'description' | 'date' | 'category' | 'icon' | 'is_milestone' | 'link'>
> = [
  {
    title: '开始写博客',
    description: '搭建个人博客，记录生活与思考',
    date: '2023-01-01',
    category: 'life',
    icon: '✍️',
    is_milestone: true,
    link: '',
  },
  {
    title: '完成博客重构',
    description: '从 WordPress 迁移到 Next.js',
    date: '2024-06-01',
    category: 'achievement',
    icon: '🚀',
    is_milestone: true,
    link: '',
  },
  {
    title: '第一份工作',
    description: '加入第一家公司，正式步入职场',
    date: '2022-07-01',
    category: 'work',
    icon: '💼',
    is_milestone: true,
    link: '',
  },
];
