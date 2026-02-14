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
    <div className="fixed top-0 left-0 right-0 h-1 bg-secondary/20 z-50">
      <motion.div
        className="h-full bg-gradient-to-r from-[var(--gradient-start)] via-primary to-[var(--gradient-end)]"
        style={{ width: `${progress}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}
