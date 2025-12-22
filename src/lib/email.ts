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
  const unsubscribeUrl = `${siteUrl}/unsubscribe`;

  const results = await Promise.allSettled(
    subscribers.map(async (subscriber) => {
      return resend.emails.send({
        from: '拾光博客 <noreply@artchain.icu>',
        to: subscriber.email,
        subject: `新文章发布: ${post.title}`,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}?email=${encodeURIComponent(subscriber.email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        text: `新文章: ${post.title}

${post.description}

阅读全文: ${postUrl}

---
你收到这封邮件是因为你订阅了拾光博客。
取消订阅: ${unsubscribeUrl}?email=${encodeURIComponent(subscriber.email)}`,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>新文章: ${post.title}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
              <tr>
                <td style="text-align: center; padding-bottom: 20px;">
                  <h1 style="color: #333333; font-size: 24px; margin: 0;">拾光博客</h1>
                  <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0;">在文字中拾起生活的微光</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                  <h2 style="color: #333333; font-size: 20px; margin: 0 0 10px 0;">${post.title}</h2>
                  <p style="color: #666666; font-size: 14px; margin: 0;">${post.description}</p>
                </td>
              </tr>
              <tr>
                <td style="text-align: center; padding: 30px 0;">
                  <a href="${postUrl}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 500;">阅读全文</a>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px solid #eeeeee; padding-top: 20px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    你收到这封邮件是因为你订阅了拾光博客。<br>
                    <a href="${unsubscribeUrl}?email=${encodeURIComponent(subscriber.email)}" style="color: #999999;">取消订阅</a>
                  </p>
                </td>
              </tr>
            </table>
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

// 发送订阅确认邮件（包含最近文章）
export async function sendSubscriptionConfirmation(
  email: string, 
  name?: string,
  recentPosts?: { title: string; slug: string; description: string }[]
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  // 生成文章列表 HTML
  const postsHtml = recentPosts && recentPosts.length > 0 
    ? `
      <tr>
        <td style="padding: 20px 0;">
          <h3 style="color: #333333; font-size: 16px; margin: 0 0 15px 0;">精选文章推荐</h3>
          ${recentPosts.map(post => `
            <div style="margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
              <a href="${siteUrl}/blog/${post.slug}" style="color: #667eea; text-decoration: none; font-weight: 500; font-size: 15px;">${post.title}</a>
              <p style="color: #666666; font-size: 13px; margin: 8px 0 0 0; line-height: 1.5;">${post.description}</p>
            </div>
          `).join('')}
        </td>
      </tr>
    `
    : '';

  // 生成纯文本文章列表
  const postsText = recentPosts && recentPosts.length > 0
    ? '\n\n精选文章推荐:\n' + recentPosts.map(post => `- ${post.title}: ${siteUrl}/blog/${post.slug}`).join('\n')
    : '';

  await resend.emails.send({
    from: '拾光博客 <noreply@artchain.icu>',
    to: email,
    subject: '感谢订阅拾光博客',
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
    },
    text: `感谢订阅

Hi${name ? ` ${name}` : ''},

真诚地感谢你订阅拾光博客！

从现在开始，每当有新文章发布，你都会第一时间收到通知。

期待与你在文字中相遇。${postsText}

浏览更多文章: ${siteUrl}/blog

---
取消订阅: ${unsubscribeUrl}`,
    html: `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>感谢订阅</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td style="text-align: center; padding-bottom: 20px;">
              <h1 style="color: #667eea; font-size: 28px; margin: 0;">感谢订阅</h1>
              <p style="color: #666666; font-size: 14px; margin: 10px 0 0 0;">欢迎加入拾光博客的读者大家庭</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 25px; background-color: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;">Hi${name ? ` ${name}` : ''},</p>
              <p style="margin: 0 0 15px 0;">真诚地感谢你订阅拾光博客！</p>
              <p style="margin: 0 0 15px 0;">从现在开始，每当有新文章发布，你都会第一时间收到通知。我会用心创作每一篇内容，希望能给你带来一些启发和思考。</p>
              <p style="margin: 0;">期待与你在文字中相遇。</p>
            </td>
          </tr>
          ${postsHtml}
          <tr>
            <td style="text-align: center; padding: 25px 0;">
              <a href="${siteUrl}/blog" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 15px; font-weight: 500;">浏览更多文章</a>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #eeeeee; padding-top: 20px;">
              <p style="color: #666666; font-size: 14px; margin: 0;">— 拾光</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 20px; text-align: center;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #999999;">取消订阅</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
