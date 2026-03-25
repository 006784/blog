import { CiyuanChat } from './chat.client';

export const metadata = {
  title: '词元 AI — 多模型对话助手',
  description: '支持 ChatGPT、Claude、Gemini、DeepSeek、MiniMax、豆包、OpenRouter 等多种 AI 模型的对话工具',
};

export default function CiyuanPage() {
  return <CiyuanChat />;
}
