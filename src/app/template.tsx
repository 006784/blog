'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { pageTransitionVariants } from '@/components/Animations';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageTransitionVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="route-transition-layer"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
