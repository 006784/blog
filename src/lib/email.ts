import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 发送新文章通知给所有订阅者
export async function sendNewPostNotification(
  subscribers: { email: string; name?: string }[],
  post: {
    title: string;
    description: string;
    slug: string;
    author: string;
  }
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  const results = await Promise.allSettled(
    subscribers.map(async (subscriber) => {
      return resend.emails.send({
        from: '拾光博客 <noreply@artchain.icu>',
        to: subscriber.email,
        subject: `📝 新文章: ${post.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">拾光</h1>
              <p style="color: #666; margin: 5px 0;">在文字中拾起生活的微光</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; color: white; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; font-size: 24px;">${post.title}</h2>
              <p style="margin: 0; opacity: 0.9;">${post.description}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${postUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 30px; font-weight: 600;">
                阅读全文 →
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              你收到这封邮件是因为你订阅了拾光博客。<br>
              <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color: #999;">取消订阅</a>
            </p>
          </body>
          </html>
        `,
      });
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { successful, failed, total: subscribers.length };
}

// 发送订阅确认邮件
export async function sendSubscriptionConfirmation(email: string, name?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  await resend.emails.send({
    from: '拾光博客 <noreply@artchain.icu>',
    to: email,
    subject: '🎉 欢迎订阅拾光博客！',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #667eea;">🎉 订阅成功！</h1>
        </div>
        
        <p>Hi${name ? ` ${name}` : ''}，</p>
        
        <p>感谢你订阅拾光博客！从现在开始，每当有新文章发布，你都会第一时间收到通知。</p>
        
        <p>期待与你在文字中相遇 ✨</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/blog" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 30px; font-weight: 600;">
            浏览文章
          </a>
        </div>
        
        <p style="color: #666;">— 拾光</p>
      </body>
      </html>
    `,
  });
}
