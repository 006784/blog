import { CiyuanChat } from './chat.client';

export const metadata = {
  title: '词元 AI — 多模型对话助手',
  description: '支持主流 AI 厂商并可自定义接入任意兼容 API 的多模型对话工具',
};

export default function CiyuanPage() {
  return <CiyuanChat />;
}
