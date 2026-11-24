import { useState } from 'react';

const GOOGLE_PLAY_URL =
  'https://play.google.com/store/apps/details?id=com.appg.bankdiary.expert';
const APPLE_STORE_URL =
  'https://apps.apple.com/kr/app/%EB%B1%85%ED%81%AC%EB%8B%A4%EC%9D%B4%EC%96%B4%EB%A6%AC-%EB%B3%B4%ED%97%98-%EC%A0%84%EB%AC%B8%EA%B0%80%EC%9A%A9/id1543640453';

function GooglePlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M3.6 2.3C3.2 2.7 3 3.3 3 4.1v15.8c0 .8.2 1.4.6 1.8l.1.1 8.8-8.8v-.2L3.7 2.2l-.1.1z"
      />
      <path
        fill="#34A853"
        d="M15.4 15.9l-2.9-2.9v-.2l2.9-2.9.1.1 3.5 2c1 .6 1 1.5 0 2.1l-3.5 2-.1-.1z"
      />
      <path
        fill="#FBBC05"
        d="M15.5 15.8L12.5 12.8 3.6 21.7c.3.3.9.4 1.6 0l10.3-5.9z"
      />
      <path
        fill="#EA4335"
        d="M15.5 8.2L5.2 2.3C4.5 1.9 3.9 2 3.6 2.3l8.9 8.9 3-3z"
      />
    </svg>
  );
}

function AppleStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#1C82F2" />
      <path
        d="M12 6.5l-4.2 8.7M12 6.5l4.2 8.7M8.7 13h6.6"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function AppDownloadBanner() {
  const [logoError, setLogoError] = useState(false);

  return (
    <section
      aria-label="뱅크다이어리 전문가앱 다운로드"
      className="rounded-2xl bg-white border border-[#E5E9F2] px-4 py-3.5 sm:px-5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
        {/* Top / Left Brand Row */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {!logoError ? (
              <img
                src="/assets/aistudio/___18_4x-100_02d3bfcf.jpg"
                alt="뱅크다이어리"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="h-[22px] sm:h-[24px] w-auto object-contain shrink-0"
              />
            ) : (
              <span className="inline-flex items-center gap-1.5 font-bold text-[15px] text-slate-700 shrink-0">
                <span className="w-5 h-5 rounded-md bg-[#1677C8] text-white text-xs font-bold inline-flex items-center justify-center">
                  B
                </span>
                <span>뱅크다이어리</span>
              </span>
            )}
            <span className="text-[16px] sm:text-[17px] font-bold tracking-tight text-slate-900 whitespace-nowrap">
              전문가앱
            </span>
          </div>

          <span className="text-[13px] font-semibold text-[#1677C8] whitespace-nowrap shrink-0 md:ml-1">
            앱 다운로드
          </span>
        </div>

        {/* Store Action Buttons */}
        <div className="grid grid-cols-2 md:flex md:items-center gap-2.5 shrink-0">
          <a
            href={GOOGLE_PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] md:min-w-[148px] px-4 py-2 rounded-xl bg-white border border-[#DFE4EE] hover:bg-[#F5F8FD] hover:border-[#C2D2EE] text-[14px] font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3B8B]"
          >
            <GooglePlayIcon />
            <span>구글플레이</span>
          </a>

          <a
            href={APPLE_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] md:min-w-[148px] px-4 py-2 rounded-xl bg-white border border-[#DFE4EE] hover:bg-[#F5F8FD] hover:border-[#C2D2EE] text-[14px] font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3B8B]"
          >
            <AppleStoreIcon />
            <span>애플스토어</span>
          </a>
        </div>
      </div>
    </section>
  );
}
