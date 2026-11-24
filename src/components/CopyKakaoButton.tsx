import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

interface CopyKakaoButtonProps {
  getCopyText: () => string;
  label?: string;
  subInfo?: string;
}

export function CopyKakaoButton({
  getCopyText,
  label = '카톡으로 보낼 결과 복사',
  subInfo,
}: CopyKakaoButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = getCopyText();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={handleCopy}
        className={`w-full min-h-[52px] px-5 py-3.5 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3B8B] focus-visible:ring-offset-2 active:scale-[0.99] ${
          copied
            ? 'bg-[#15693F] text-white shadow-sm'
            : 'bg-[#1D3B8B] hover:bg-[#162F72] text-white shadow-sm'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>복사되었습니다 — 카톡에 바로 붙여넣으세요</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </button>
      {subInfo && !copied && (
        <p className="text-center text-xs text-slate-500">{subInfo}</p>
      )}
    </div>
  );
}
