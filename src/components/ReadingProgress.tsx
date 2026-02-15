'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * 阅读进度条组件
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollableHeight = documentHeight - windowHeight;
      const scrolled = scrollTop / scrollableHeight;
      
      setProgress(Math.min(Math.max(scrolled * 100, 0), 100));
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] bg-secondary/15 z-50 backdrop-blur-xl">
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-[var(--gradient-start)] via-primary to-[var(--gradient-end)] shadow-[0_0_12px_color-mix(in_srgb,var(--gradient-start)_35%,transparent)]"
        style={{ width: `${progress}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 240, damping: 34, mass: 0.8 }}
      />
    </div>
  );
}
