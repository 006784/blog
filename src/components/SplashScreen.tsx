'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  quote: { text: string; author: string };
  onDismiss: () => void;
}

export function SplashScreen({ quote, onDismiss }: SplashScreenProps) {
  const [avatar, setAvatar] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: { avatar?: string }) => { setAvatar(d.avatar ?? ''); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onDismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <motion.div
      className="splash-root"
      role="button"
      tabIndex={0}
      aria-label="点击进入博客"
      onClick={onDismiss}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* 角落光晕 */}
      <div className="splash-glow" aria-hidden="true" />

      <motion.div
        className="splash-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* 头像 */}
        <div className="splash-avatar-ring">
          {loaded && avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatar} alt="博主头像" className="splash-avatar-img" />
          ) : (
            <div className="splash-avatar-fallback">L</div>
          )}
        </div>

        {/* 博客名 */}
        <h1 className="splash-site-title">拾光</h1>
        <p className="splash-site-sub">在文字中拾起生活的微光</p>

        {/* 分割线 */}
        <div className="splash-divider" aria-hidden="true" />

        {/* 名言 */}
        <blockquote className="splash-quote">{quote.text}</blockquote>
        <p className="splash-quote-author">—— {quote.author}</p>

        {/* 入场提示 */}
        <p className="splash-hint">
          <span className="splash-hint-dot" />
          轻触任意处进入
        </p>
      </motion.div>
    </motion.div>
  );
}
