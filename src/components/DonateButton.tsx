'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart, X, Copy, Check, ExternalLink } from 'lucide-react';

interface DonateProfile {
  donate_wechat: string;
  donate_alipay: string;
  donate_paypal: string;
  donate_btc: string;
  donate_eth: string;
  donate_usdt_trc20: string;
}

type TabKey = 'wechat' | 'alipay' | 'paypal' | 'crypto';

function CryptoAddress({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="donate-crypto-item">
      <span className="donate-crypto-label">{label}</span>
      <div className="donate-crypto-addr-row">
        <code className="donate-crypto-addr">{address}</code>
        <button type="button" className="donate-crypto-copy" onClick={copy} aria-label="复制地址">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      {/* 二维码（通过公共 API 生成） */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(address)}&bgcolor=ffffff&color=000000&margin=6`}
        alt={`${label} 二维码`}
        className="donate-crypto-qr"
        loading="lazy"
      />
    </div>
  );
}

export function DonateButton() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<DonateProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('wechat');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then((d: Partial<DonateProfile>) => {
        const p: DonateProfile = {
          donate_wechat: d.donate_wechat ?? '',
          donate_alipay: d.donate_alipay ?? '',
          donate_paypal: d.donate_paypal ?? '',
          donate_btc: d.donate_btc ?? '',
          donate_eth: d.donate_eth ?? '',
          donate_usdt_trc20: d.donate_usdt_trc20 ?? '',
        };
        const hasAny = Object.values(p).some(Boolean);
        if (hasAny) setProfile(p);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    // 自动选中第一个有配置的标签
    if (profile.donate_wechat) { setActiveTab('wechat'); return; }
    if (profile.donate_alipay) { setActiveTab('alipay'); return; }
    if (profile.donate_paypal) { setActiveTab('paypal'); return; }
    if (profile.donate_btc || profile.donate_eth || profile.donate_usdt_trc20) setActiveTab('crypto');
  }, [profile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  if (!profile) return null;

  const hasCrypto = profile.donate_btc || profile.donate_eth || profile.donate_usdt_trc20;

  const allTabs: { key: TabKey; label: string; visible: boolean }[] = [
    { key: 'wechat', label: '微信支付', visible: !!profile.donate_wechat },
    { key: 'alipay', label: '支付宝', visible: !!profile.donate_alipay },
    { key: 'paypal', label: 'PayPal', visible: !!profile.donate_paypal },
    { key: 'crypto', label: '加密货币', visible: !!hasCrypto },
  ];
  const tabs = allTabs.filter(t => t.visible);

  const visibleTab = tabs.find(t => t.key === activeTab) ? activeTab : tabs[0]?.key ?? 'wechat';

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

            {/* 标签页 */}
            {tabs.length > 1 && (
              <div className="donate-tabs">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    className={`donate-tab${visibleTab === t.key ? ' donate-tab--active' : ''}`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* 内容区 */}
            <div className="donate-panel">
              {/* 微信 / 支付宝 二维码 */}
              {(visibleTab === 'wechat' || visibleTab === 'alipay') && (
                <div className="donate-qr-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={visibleTab === 'wechat' ? profile.donate_wechat : profile.donate_alipay}
                    alt={visibleTab === 'wechat' ? '微信支付' : '支付宝'}
                    className="donate-qr-img"
                  />
                  <span className="donate-qr-label">
                    {visibleTab === 'wechat' ? '扫码微信支付' : '扫码支付宝'}
                  </span>
                </div>
              )}

              {/* PayPal */}
              {visibleTab === 'paypal' && (
                <div className="donate-paypal-wrap">
                  <p className="donate-paypal-hint">点击下方按钮跳转至 PayPal 完成打赏</p>
                  <a
                    href={profile.donate_paypal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="donate-paypal-btn"
                  >
                    <ExternalLink size={15} />
                    通过 PayPal 打赏
                  </a>
                </div>
              )}

              {/* 加密货币 */}
              {visibleTab === 'crypto' && (
                <div className="donate-crypto-list">
                  {profile.donate_btc && <CryptoAddress label="Bitcoin (BTC)" address={profile.donate_btc} />}
                  {profile.donate_eth && <CryptoAddress label="Ethereum (ETH)" address={profile.donate_eth} />}
                  {profile.donate_usdt_trc20 && <CryptoAddress label="USDT (TRC20)" address={profile.donate_usdt_trc20} />}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
