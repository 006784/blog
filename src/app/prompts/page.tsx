import type { Metadata } from 'next';
import { PromptsClient } from './page.client';

export const metadata: Metadata = {
  title: '提示词库 · 拾光',
  description: 'GPT Image 2 精选创意提示词收藏，涵盖头像、社媒、信息图、电商、游戏等多个类别。',
};

export default function PromptsPage() {
  return <PromptsClient />;
}
