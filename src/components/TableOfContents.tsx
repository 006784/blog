'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, ChevronRight, X } from 'lucide-react';
import {
  APPLE_EASE_SOFT,
  APPLE_SPRING_GENTLE,
  HOVER_BUTTON,
  TAP_BUTTON,
  bottomSheetVariants,
  modalBackdropVariants,
} from './Animations';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // 解析Markdown标题
  useEffect(() => {
    const regex = /^(#{1,6})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`\[\]]/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '');
      
      items.push({ id, text, level });
    }

    setHeadings(items);
  }, [content]);

  // 监听滚动更新当前活动标题
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
      }
    );

    // 观察所有标题元素
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  // 滚动到指定标题
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
      setIsOpen(false);
    }
  }, []);

  if (headings.length === 0) return null;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      {/* 桌面端侧边目录 */}
      <nav className={`hidden xl:block ${className}`}>
        <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <List className="w-4 h-4" />
            目录
          </h4>
          <ul className="space-y-2 text-sm">
            {headings.map((heading) => (
              <li
                key={heading.id}
                style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
              >
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`ios-button-press text-left w-full py-1 px-2 rounded-lg transition-all duration-200 hover:bg-primary/5 ${
                    activeId === heading.id
                      ? 'text-primary font-medium bg-primary/10 border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="line-clamp-2">{heading.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 移动端浮动按钮和弹出目录 */}
      <div className="xl:hidden">
        {/* 浮动按钮 */}
        <motion.button
          whileHover={HOVER_BUTTON}
          whileTap={TAP_BUTTON}
          transition={APPLE_SPRING_GENTLE}
          onClick={() => setIsOpen(true)}
          className="ios-button-press fixed bottom-24 right-4 z-40 p-3 rounded-full bg-primary text-white shadow-lg shadow-primary/25"
        >
          <List className="w-5 h-5" />
        </motion.button>

        {/* 弹出目录 */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                variants={modalBackdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="ios-modal-overlay fixed inset-0 z-50"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                variants={bottomSheetVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="ios-sheet-card fixed bottom-0 left-0 right-0 z-50 max-h-[82vh] overflow-hidden border-t border-border shadow-2xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <List className="w-5 h-5" />
                    文章目录
                  </h3>
                  <motion.button
                    whileHover={HOVER_BUTTON}
                    whileTap={TAP_BUTTON}
                    transition={APPLE_SPRING_GENTLE}
                    onClick={() => setIsOpen(false)}
                    className="ios-button-press p-2 rounded-lg hover:bg-muted"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(82vh-80px)]">
                  <ul className="space-y-2">
                    {headings.map((heading) => (
                      <li
                        key={heading.id}
                        style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                      >
                        <motion.button
                          whileHover={HOVER_BUTTON}
                          whileTap={TAP_BUTTON}
                          transition={APPLE_SPRING_GENTLE}
                          onClick={() => scrollToHeading(heading.id)}
                          className={`ios-button-press flex items-center gap-2 w-full py-2 px-3 rounded-lg text-left transition-all ${
                            activeId === heading.id
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${
                            activeId === heading.id ? 'rotate-90' : ''
                          }`} />
                          <span className="line-clamp-2">{heading.text}</span>
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default TableOfContents;
