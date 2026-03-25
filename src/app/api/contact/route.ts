import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseBody, ok, err, z } from '@/lib/api';

// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;

const contactSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('请输入有效的邮箱地址'),
  subject: z.string().min(1, '主题不能为空'),
  message: z.string().min(1, '消息内容不能为空'),
});

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, contactSchema);
  if (parsed instanceof Response) return parsed;
  const { name, email, subject, message } = parsed;

  const { error } = await supabaseAdmin.from('contact_messages').insert([{
    name, email, subject, message,
    is_read: false,
    created_at: new Date().toISOString(),
  }]);

  if (error) {
    console.error('Supabase error:', error);
    return err('保存消息失败，请稍后重试', 500);
  }

  return ok({ message: '消息已发送成功！我们会尽快回复您。' });
}
