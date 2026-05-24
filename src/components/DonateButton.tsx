'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, X } from 'lucide-react';

interface DonateInfo {
  wechat: string;
  alipay: string;
}

export function DonateButton() {
  const [open, setOpen] = useState(false);
  const [donate, setDonate] = useState<DonateInfo | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: { donate_wechat?: string; donate_alipay?: string }) => {
        if (d.donate_wechat || d.donate_alipay) {
          setDonate({ wechat: d.donate_wechat ?? '', alipay: d.donate_alipay ?? '' });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // 点击遮罩关闭
  const handleBackdrop = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  if (!donate) return null;

  const hasTwo = donate.wechat && donate.alipay;

  return (
    <>
      <button
        type="button"
        className="donate-btn"
        onClick={() => setOpen(true)}
        aria-label="打赏作者"
      >
        <Heart className="donate-btn-icon" />
        <span>打赏</span>
      </button>

      {open && (
        <div className="donate-backdrop" onClick={handleBackdrop} aria-modal="true" role="dialog">
          <div className="donate-modal" ref={modalRef}>
            <button
              type="button"
              className="donate-close"
              onClick={() => setOpen(false)}
              aria-label="关闭"
            >
              <X size={18} />
            </button>

            <p className="donate-title">请我喝杯咖啡</p>
            <p className="donate-sub">你的支持是我持续创作的动力</p>

            <div className={`donate-qr-row${hasTwo ? ' donate-qr-row--two' : ''}`}>
              {donate.wechat && (
                <div className="donate-qr-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={donate.wechat} alt="微信支付" className="donate-qr-img" />
                  <span className="donate-qr-label">微信支付</span>
                </div>
              )}
              {donate.alipay && (
                <div className="donate-qr-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={donate.alipay} alt="支付宝" className="donate-qr-img" />
                  <span className="donate-qr-label">支付宝</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
