import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '编程练习 | 题库',
  description: '包含算法题、选择题、面试题的综合编程练习平台，支持 Python、JavaScript、Java、C++、C、PHP、TypeScript 在线运行',
  robots: { index: true, follow: true },
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
