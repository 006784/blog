'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link2, Twitter, MessageCircle, Copy, Check, X, QrCode } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  url?: string;
  description?: string;
}

export function ShareButton({ title, url, description = '' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = typeof window !== 'undefined' ? url || window.location.href : '';

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 复制链接
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 分享到微博
  const shareToWeibo = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
    window.open(weiboUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  // 分享到Twitter
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  // 使用原生分享API（移动端）
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setIsOpen(true);
    }
  };

  const shareOptions = [
    {
      name: '复制链接',
      icon: copied ? Check : Copy,
      action: copyLink,
      color: copied ? 'text-green-500' : 'text-muted-foreground'
    },
    {
      name: '微博',
      icon: MessageCircle,
      action: shareToWeibo,
      color: 'text-red-500'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      action: shareToTwitter,
      color: 'text-blue-400'
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={nativeShare}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">分享</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl border border-border shadow-xl overflow-hidden z-50"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                分享到
              </div>
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <option.icon className={`w-5 h-5 ${option.color}`} />
                  <span className="text-sm">{option.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 微信二维码弹窗 */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">微信扫码分享</h3>
                <button
                  onClick={() => setShowQR(false)}
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-square bg-white rounded-xl flex items-center justify-center">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                打开微信扫一扫
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShareButton;
