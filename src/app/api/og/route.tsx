import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const title = searchParams.get('title') || 'Lumen';
  const description = searchParams.get('description') || '在文字中拾起生活的微光';
  const author = searchParams.get('author') || 'Lumen';
  const date = searchParams.get('date') || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景装饰光晕 */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(196,169,109,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          }}
        />

        {/* 左侧竖线装饰 */}
        <div
          style={{
            position: 'absolute',
            left: '64px',
            top: '64px',
            bottom: '64px',
            width: '3px',
            background: 'linear-gradient(180deg, transparent, #c4a96d, transparent)',
          }}
        />

        {/* 主内容区 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 80px 64px 96px',
            width: '100%',
          }}
        >
          {/* 顶部 — 站名 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#c4a96d',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              LUMEN
            </div>
            <div
              style={{
                width: '40px',
                height: '1px',
                background: 'rgba(196,169,109,0.4)',
              }}
            />
            <div
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em',
              }}
            >
              光的博客
            </div>
          </div>

          {/* 中部 — 标题和摘要 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: title.length > 30 ? '42px' : '52px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                maxWidth: '900px',
                // 超长标题截断
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: '22px',
                  color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.6,
                  maxWidth: '800px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {description}
              </div>
            )}
          </div>

          {/* 底部 — 作者 + 日期 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            {/* 作者头像占位 */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #c4a96d, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {author.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {author}
              </div>
              {date && (
                <div
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  {date}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    }
  );
}
