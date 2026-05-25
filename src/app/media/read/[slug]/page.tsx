import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NovelReader } from '@/components/novels/NovelReader';
import { getNovelBySlug, NOVELS } from '@/lib/novels';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return NOVELS.map((novel) => ({ slug: novel.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const novel = getNovelBySlug(slug);
  if (!novel) return { title: '小说阅读器' };
  return {
    title: `${novel.title} | 小说阅读器`,
    description: `在线阅读 ${novel.title}，文本来源 ${novel.sourceName}。`,
  };
}

export default async function NovelReaderPage({ params }: Props) {
  const { slug } = await params;
  const novel = getNovelBySlug(slug);

  if (!novel) notFound();

  return <NovelReader novel={novel} />;
}
