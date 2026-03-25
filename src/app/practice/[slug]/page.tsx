import type { Metadata } from 'next';
import { ProblemPageClient } from './page-client';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/practice/problems/${slug}`);
    if (res.ok) {
      const { problem } = await res.json();
      return {
        title: `${problem.title} | 编程练习`,
        description: problem.description.slice(0, 160),
      };
    }
  } catch {}
  return { title: '编程练习' };
}

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params;
  return <ProblemPageClient slug={slug} />;
}
