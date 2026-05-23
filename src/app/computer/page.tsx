import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDownToLine,
  BadgeCheck,
  Grid3X3,
  Monitor,
  Palette,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

type Wallpaper = {
  title: string;
  mood: string;
  ratio: string;
  resolution: string;
  image: string;
  accent: string;
  tags: string[];
};

const wallpapers: Wallpaper[] = [
  {
    title: '极光工作台',
    mood: '深色桌面 / 代码夜航',
    ratio: '16:9',
    resolution: '4K',
    image:
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1800&q=88',
    accent: '适合 OLED 与深色主题',
    tags: ['aurora', 'dark', 'focus'],
  },
  {
    title: '雪山留白',
    mood: '干净 / 高亮 Dock',
    ratio: '16:10',
    resolution: '5K',
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=88',
    accent: '适合 MacBook 宽屏',
    tags: ['minimal', 'snow', 'calm'],
  },
  {
    title: '城市霓虹',
    mood: '赛博 / 夜间桌面',
    ratio: '21:9',
    resolution: 'UWQHD',
    image:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=88',
    accent: '适合带鱼屏',
    tags: ['city', 'neon', 'ultrawide'],
  },
  {
    title: '森林晨雾',
    mood: '自然 / 低干扰',
    ratio: '16:9',
    resolution: '4K',
    image:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=88',
    accent: '适合长期办公',
    tags: ['forest', 'green', 'soft'],
  },
  {
    title: '沙丘暖光',
    mood: '暖色 / 简洁图标区',
    ratio: '16:10',
    resolution: '5K',
    image:
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1800&q=88',
    accent: '适合浅色主题',
    tags: ['warm', 'desert', 'clean'],
  },
  {
    title: '宇宙微光',
    mood: '沉浸 / 灵感板',
    ratio: '32:9',
    resolution: 'Dual 4K',
    image:
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1800&q=88',
    accent: '适合双屏拼接',
    tags: ['space', 'wide', 'dream'],
  },
];

const collections = [
  { label: '深色护眼', count: 18, icon: Monitor },
  { label: '极简桌面', count: 24, icon: Grid3X3 },
  { label: '自然风景', count: 32, icon: Palette },
];

export default function ComputerPage() {
  const featured = wallpapers[0];

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-5">
            <Badge tone="info" variant="soft" className="w-fit gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              Desktop Wallpapers
            </Badge>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                电脑专区
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
                收集适合电脑桌面的壁纸：从安静的自然风景到深色工作台，按屏幕比例、氛围和使用场景快速挑选。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['4K', '5K', '16:10', '21:9', '双屏', '深色主题'].map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {collections.map((item) => (
              <Card key={item.label} variant="glass" padding="sm">
                <item.icon className="h-5 w-5 text-(--color-primary-600)" />
                <p className="mt-4 text-lg font-semibold text-neutral-900">
                  {item.count}
                </p>
                <p className="text-sm text-neutral-600">{item.label}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-xl)">
          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative min-h-[280px] overflow-hidden sm:min-h-[420px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                {featured.tags.map((tag) => (
                  <Badge key={tag} className="border-white/20 bg-white/20 text-white backdrop-blur-xl">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between gap-8 p-6 sm:p-8">
              <div className="space-y-4">
                <Badge tone="warning" variant="soft" className="w-fit gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  本周推荐
                </Badge>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">
                    {featured.mood}。{featured.accent}，画面中部留有充足空间，适合放置桌面组件和常用文件夹。
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card variant="bordered" padding="sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Ratio
                  </p>
                  <p className="mt-2 text-xl font-semibold">{featured.ratio}</p>
                </Card>
                <Card variant="bordered" padding="sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Quality
                  </p>
                  <p className="mt-2 text-xl font-semibold">{featured.resolution}</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                精选壁纸
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                点击下载会打开原图来源，后续可以接入后台上传和分类管理。
              </p>
            </div>
            <Badge variant="soft" className="w-fit gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5" />
              电脑屏幕优先
            </Badge>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {wallpapers.map((wallpaper) => (
              <article
                key={wallpaper.title}
                className="group overflow-hidden rounded-2xl border border-(--border-default) bg-(--surface-panel) shadow-(--shadow-sm) transition-all duration-(--duration-normal) hover:-translate-y-1 hover:shadow-(--shadow-lg)"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={wallpaper.image}
                    alt={wallpaper.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge className="border-white/20 bg-black/25 text-white backdrop-blur-xl">
                      {wallpaper.resolution}
                    </Badge>
                    <Badge className="border-white/20 bg-black/25 text-white backdrop-blur-xl">
                      {wallpaper.ratio}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {wallpaper.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {wallpaper.mood}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wallpaper.tags.map((tag) => (
                      <Badge key={tag} variant="soft">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Link
                    href={wallpaper.image}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-(--border-default) bg-(--surface-base) px-4 text-sm font-medium text-neutral-800 transition hover:border-(--color-primary-300) hover:text-(--color-primary-600)"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    下载壁纸
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
