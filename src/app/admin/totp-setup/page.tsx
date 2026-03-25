'use client';
import { useState } from 'react';

export default function TotpSetupPage() {
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState('');
  const [step, setStep] = useState<'init' | 'scan' | 'done'>('init');

  async function getQR() {
    setResult('请求中...');
    try {
      const res = await fetch('/api/auth/totp/setup', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setQr(data.data.qrDataUrl);
        setSecret(data.data.secret);
        setResult('');
        setStep('scan');
      } else {
        setResult('获取失败：' + (data.error || JSON.stringify(data)));
      }
    } catch (e) {
      setResult('网络错误：' + String(e));
    }
  }

  async function activate() {
    const res = await fetch('/api/auth/totp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success) {
      setStep('done');
    } else {
      setResult('错误：' + data.error);
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 480 }}>
      {step === 'init' && (
        <>
          <h2>开启双因素认证</h2>
          <button onClick={getQR} style={{ fontSize: 18, padding: '10px 28px', cursor: 'pointer' }}>
            生成二维码
          </button>
          {result && <p style={{ color: 'red', marginTop: 16 }}>{result}</p>}
        </>
      )}

      {step === 'scan' && (
        <>
          <h2>扫描二维码</h2>
          <p>用 Google Authenticator 扫下方二维码，或手动输入密钥：</p>
          <img src={qr} alt="TOTP QR" style={{ width: 200, height: 200, display: 'block', margin: '16px 0' }} />
          <p style={{ wordBreak: 'break-all', background: '#f5f5f5', padding: 8 }}>
            手动密钥：<strong>{secret}</strong>
          </p>
          <p style={{ marginTop: 24 }}>扫完后输入 App 里的 6 位验证码：</p>
          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            inputMode="numeric"
            placeholder="000000"
            style={{ fontSize: 32, letterSpacing: 8, width: 200, padding: 8 }}
            autoFocus
          />
          <br /><br />
          <button
            onClick={activate}
            disabled={code.length !== 6}
            style={{ fontSize: 18, padding: '10px 28px', cursor: 'pointer' }}
          >
            激活
          </button>
          {result && <p style={{ color: 'red', marginTop: 16 }}>{result}</p>}
        </>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{ fontSize: 64 }}>✅</div>
          <h2>双因素认证已开启！</h2>
          <p>下次登录时需要额外输入 Authenticator 中的验证码。</p>
          <a href="/admin" style={{ fontSize: 18 }}>返回后台</a>
        </div>
      )}
    </div>
  );
}
