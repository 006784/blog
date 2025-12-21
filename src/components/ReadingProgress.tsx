'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

interface ReadingProgressProps {
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

export function ReadingProgress({ 
  color = 'var(--gradient-start)', 
  height = 3,
  showPercentage = false 
}: ReadingProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setPercentage(Math.round(latest * 100));
    });
  }, [scrollYProgress]);

  return (
    <>
      {/* 进度条 */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[100] origin-left"
        style={{
          scaleX,
          height,
          background: `linear-gradient(90deg, ${color}, var(--gradient-end))`,
        }}
      />
      
      {/* 百分比显示 */}
      {showPercentage && percentage > 0 && percentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-[99] px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border shadow-lg text-sm font-medium"
        >
          {percentage}%
        </motion.div>
      )}
    </>
  );
}

export default ReadingProgress;
