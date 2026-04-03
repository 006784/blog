import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Lumen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Lumen';
  const siteDesc = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '在文字中拾起生活的微光';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2018 50%, #1a1410 100%)',
          position: 'relative',
        }}
      >
        {/* 背景纹理点 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 20% 20%, rgba(196,169,109,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(196,169,109,0.10) 0%, transparent 50%)',
          }}
        />

        {/* 金色分隔线 */}
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 80,
            right: 80,
            height: 1,
            background: 'rgba(196,169,109,0.3)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 80,
            right: 80,
            height: 1,
            background: 'rgba(196,169,109,0.3)',
          }}
        />

        {/* 主标题 */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: '#c4a96d',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          {siteName}
        </div>

        {/* 副标题 */}
        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.05em',
            fontWeight: 300,
          }}
        >
          {siteDesc}
        </div>
      </div>
    ),
    { ...size }
  );
}
