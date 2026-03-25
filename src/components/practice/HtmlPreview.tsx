'use client';

import { useEffect, useRef } from 'react';

export function HtmlPreview({ code }: { code: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    // Use srcdoc for safe sandboxed preview
    iframe.srcdoc = code;
  }, [code]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3d3d3d] text-xs text-gray-400">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        预览
      </div>
      <iframe
        ref={iframeRef}
        title="HTML Preview"
        sandbox="allow-scripts allow-same-origin"
        className="flex-1 w-full bg-white"
      />
    </div>
  );
}
