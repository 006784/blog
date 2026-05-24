'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  postId: string;
}

export function AISummary({ postId }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/ai-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.summary) setSummary(data.summary);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [postId]);

  if (error) return null;

  return (
    <div className="ai-summary-block">
      <div className="ai-summary-header">
        <Sparkles className="ai-summary-icon" />
        <span>AI 摘要</span>
        <span className="ai-summary-badge">DeepSeek</span>
      </div>

      {loading ? (
        <div className="ai-summary-skeleton">
          <div className="ai-summary-skeleton-line w-full" />
          <div className="ai-summary-skeleton-line w-5/6" />
          <div className="ai-summary-skeleton-line w-4/5" />
          <div className="ai-summary-skeleton-line w-full" />
          <div className="ai-summary-skeleton-line w-3/4" />
        </div>
      ) : (
        <ul className="ai-summary-list">
          {summary!
            .split('\n')
            .map((line) => line.replace(/^·\s*/, '').trim())
            .filter(Boolean)
            .map((point, i) => (
              <li key={i} className="ai-summary-item">
                <span className="ai-summary-dot" />
                {point}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
