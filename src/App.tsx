/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppDownloadBanner } from './components/AppDownloadBanner';
import { BasketInflationTab } from './components/BasketInflationTab';
import { InterestCompareTab } from './components/InterestCompareTab';
import { MoneyValueTab } from './components/MoneyValueTab';
import { RefundRateTab } from './components/RefundRateTab';
import { SavingsGoalTab } from './components/SavingsGoalTab';

type TabKey = 'basket' | 'value' | 'interest' | 'savings' | 'refund';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'basket', label: '장바구니 물가' },
  { key: 'value', label: '돈의 가치' },
  { key: 'interest', label: '단리·복리' },
  { key: 'savings', label: '목돈·적립' },
  { key: 'refund', label: '환급률' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('basket');

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900">
      {/* Top App Download Strip */}
      <div className="bg-[#F5F7FB] pt-3.5 pb-3 border-b border-[#E5E9F2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <AppDownloadBanner />
        </div>
      </div>

      {/* Top Workspace Header + Tab Switcher */}
      <header className="bg-white border-b border-[#E5E9F2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-[24px] sm:text-[26px] font-bold tracking-tight text-slate-950 leading-tight">
                상담 재무계산기
              </h1>
              <p className="mt-1 text-[14px] text-slate-600">
                물가·이자·수익률을 고객과 함께 바로 계산합니다
              </p>
            </div>
          </div>

          {/* 5 Interactive Calculator Tabs */}
          <nav
            aria-label="재무 계산기 메뉴"
            className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[42px] px-4 py-2 rounded-full text-[14px] font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3B8B] ${
                    isActive
                      ? 'bg-[#1D3B8B] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-[#DFE4EE] hover:bg-[#F4F6FA] hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Consultation Workspace */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {activeTab === 'basket' && <BasketInflationTab />}
        {activeTab === 'value' && <MoneyValueTab />}
        {activeTab === 'interest' && <InterestCompareTab />}
        {activeTab === 'savings' && <SavingsGoalTab />}
        {activeTab === 'refund' && <RefundRateTab />}
      </main>
    </div>
  );
}
