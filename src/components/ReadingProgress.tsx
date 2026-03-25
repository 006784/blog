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
    <div className="fixed top-0 left-0 right-0 h-[1px] z-50">
      <motion.div
        className="h-full origin-left"
        style={{ width: `${progress}%`, background: 'var(--gold, #c4a96d)' }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 240, damping: 34, mass: 0.8 }}
      />
    </div>
  );
}
