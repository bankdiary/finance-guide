import { useMemo, useState } from 'react';
import { OVERALL_CPI } from '../data/financialData';
import {
  calculateMonthlyPlanAnnualIRR,
  formatKoreanUnits,
  formatManEok,
  formatWon,
} from '../utils/formatters';
import { CopyKakaoButton } from './CopyKakaoButton';

type PaymentType = 'monthly' | 'lump';
type InputBy = 'rate' | 'amount';

const MONTHLY_PAY_PRESETS = [
  { label: '20만 원', value: 200000 },
  { label: '30만 원', value: 300000 },
  { label: '50만 원', value: 500000 },
  { label: '100만 원', value: 1000000 },
];

const LUMP_PAY_PRESETS = [
  { label: '1,000만 원', value: 10000000 },
  { label: '3,000만 원', value: 30000000 },
  { label: '5,000만 원', value: 50000000 },
  { label: '1억 원', value: 100000000 },
];

export function RefundRateTab() {
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly');
  const [monthlyPay, setMonthlyPay] = useState<number>(300000);
  const [lumpPay, setLumpPay] = useState<number>(30000000);
  const [payYears, setPayYears] = useState<number>(10);
  const [totalYears, setTotalYears] = useState<number>(15);
  const [inputBy, setInputBy] = useState<InputBy>('rate');
  const [targetRefundRate, setTargetRefundRate] = useState<number>(125.0);
  const [directRefundAmount, setDirectRefundAmount] = useState<number>(45000000);
  const [isTaxFree, setIsTaxFree] = useState<boolean>(true);

  const effectiveTotalYears = paymentType === 'monthly' ? Math.max(payYears, totalYears) : totalYears;

  const analysis = useMemo(() => {
    const totalPaid =
      paymentType === 'monthly' ? monthlyPay * payYears * 12 : lumpPay;

    const expectedRefund =
      inputBy === 'rate'
        ? Math.round((totalPaid * targetRefundRate) / 100)
        : directRefundAmount;

    const refundRatePct = totalPaid > 0 ? (expectedRefund / totalPaid) * 100 : 0;
    const netProfit = expectedRefund - totalPaid;

    // Annualized IRR
    let annualIRR = 0;
    if (paymentType === 'monthly') {
      annualIRR = calculateMonthlyPlanAnnualIRR(
        monthlyPay,
        payYears * 12,
        effectiveTotalYears * 12,
        expectedRefund
      );
    } else {
      if (totalPaid > 0 && expectedRefund > 0 && effectiveTotalYears > 0) {
        annualIRR = (Math.pow(expectedRefund / totalPaid, 1 / effectiveTotalYears) - 1) * 100;
      }
    }

    // Bank deposit equivalent pre-tax rate (when product is tax-free vs general 15.4% deposit)
    const bankEquivalentRate = isTaxFree ? annualIRR / (1 - 0.154) : annualIRR;

    // Real inflation-adjusted value at maturity (using 2.28% CPI average)
    const realValueToday =
      expectedRefund /
      Math.pow(1 + OVERALL_CPI.exactAnnualRatePct / 100, effectiveTotalYears);
    const realRefundRatePct = totalPaid > 0 ? (realValueToday / totalPaid) * 100 : 0;

    return {
      totalPaid,
      expectedRefund,
      refundRatePct,
      netProfit,
      annualIRR,
      bankEquivalentRate,
      realValueToday,
      realRefundRatePct,
    };
  }, [
    paymentType,
    monthlyPay,
    lumpPay,
    payYears,
    effectiveTotalYears,
    inputBy,
    targetRefundRate,
    directRefundAmount,
    isTaxFree,
  ]);

  const getCopyText = () => {
    const planDesc =
      paymentType === 'monthly'
        ? `월 ${formatManEok(monthlyPay)} · ${payYears}년 납입 / ${effectiveTotalYears}년 시점`
        : `일시납 ${formatManEok(lumpPay)} · ${effectiveTotalYears}년 거치`;

    const lines = [
      `[상담 재무계산기 · 환급률 및 실질수익률 분석]`,
      ``,
      `■ 기준 조건: ${planDesc}`,
      `· 총 납입 원금: ${formatKoreanUnits(analysis.totalPaid)}`,
      `· 예상 환급금: ${formatKoreanUnits(analysis.expectedRefund)} (단순 환급률 ${analysis.refundRatePct.toFixed(1)}%)`,
      `· 순수익: ${analysis.netProfit >= 0 ? '+' : ''}${formatKoreanUnits(analysis.netProfit)}`,
      ``,
      `■ 실제 연환산 수익률(IRR)`,
      `· 연평균 복리 수익률: 연 ${analysis.annualIRR.toFixed(2)}%`,
      ...(isTaxFree
        ? [
            `· 비과세 기준 은행 일반과세(15.4%) 예금 환산 시: 세전 연 ${analysis.bankEquivalentRate.toFixed(2)}% 예금과 동일`,
          ]
        : []),
      `· 물가(연 ${OVERALL_CPI.exactAnnualRatePct}%) 반영 오늘 가치: ${formatKoreanUnits(
        analysis.realValueToday
      )} (실질 환급률 ${analysis.realRefundRatePct.toFixed(1)}%)`,
    ];
    return lines.join('\n');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* 1. 조건 설정 (Mobile: 1st right under tab menu | Desktop: Right column top) */}
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-5">
          {/* Payment Type Toggle */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#EFF2F7]">
            <button
              type="button"
              onClick={() => setPaymentType('monthly')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                paymentType === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              월납 적립형
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('lump')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                paymentType === 'lump'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              일시납 거치형
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-slate-900">
              {paymentType === 'monthly' ? '월 납입금액 및 기간' : '일시납 금액 및 거치기간'}
            </h2>
            <div className="inline-flex p-1 rounded-xl bg-[#EFF2F7]">
              <button
                type="button"
                onClick={() => setIsTaxFree(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  isTaxFree ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                비과세
              </button>
              <button
                type="button"
                onClick={() => setIsTaxFree(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                  !isTaxFree ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                과세 상품
              </button>
            </div>
          </div>

          {/* Payment Amount */}
          {paymentType === 'monthly' ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {MONTHLY_PAY_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setMonthlyPay(p.value)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      monthlyPay === p.value
                        ? 'bg-[#1D3B8B] text-white'
                        : 'bg-[#EFF2F7] text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={50000}
                  min={10000}
                  value={monthlyPay}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) setMonthlyPay(v);
                  }}
                  aria-label="월 납입금액"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
                />
                <span className="text-sm font-medium text-slate-500 shrink-0">원/월</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {LUMP_PAY_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setLumpPay(p.value)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      lumpPay === p.value
                        ? 'bg-[#1D3B8B] text-white'
                        : 'bg-[#EFF2F7] text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={1000000}
                  min={100000}
                  value={lumpPay}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) setLumpPay(v);
                  }}
                  aria-label="일시납 금액"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
                />
                <span className="text-sm font-medium text-slate-500 shrink-0">원</span>
              </div>
            </div>
          )}

          {/* Pay Period & Holding Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {paymentType === 'monthly' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="rr-pay-years" className="font-semibold text-slate-700">
                    납입 기간
                  </label>
                  <span className="font-bold text-slate-900 tabular-nums">{payYears}년</span>
                </div>
                <input
                  id="rr-pay-years"
                  type="range"
                  min={1}
                  max={25}
                  value={payYears}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPayYears(v);
                    if (totalYears < v) setTotalYears(v);
                  }}
                  className="w-full calc-slider"
                />
                <div className="flex gap-1.5">
                  {[5, 7, 10, 15, 20].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setPayYears(y);
                        if (totalYears < y) setTotalYears(y);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        payYears === y
                          ? 'bg-[#1D3B8B] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {y}년
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`space-y-2 ${paymentType === 'lump' ? 'sm:col-span-2' : ''}`}>
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="rr-total-years" className="font-semibold text-slate-700">
                  해지·만기 시점
                </label>
                <span className="font-bold text-[#1D3B8B] tabular-nums">
                  {effectiveTotalYears}년 차
                </span>
              </div>
              <input
                id="rr-total-years"
                type="range"
                min={paymentType === 'monthly' ? payYears : 1}
                max={40}
                value={effectiveTotalYears}
                onChange={(e) => setTotalYears(Number(e.target.value))}
                className="w-full calc-slider"
              />
              <div className="flex flex-wrap gap-1.5">
                {[5, 10, 15, 20, 30]
                  .filter((y) => (paymentType === 'monthly' ? y >= payYears : true))
                  .map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setTotalYears(y)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        effectiveTotalYears === y
                          ? 'bg-[#1D3B8B] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {y}년
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Expected Refund Rate or Amount */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">예상 환급 기준 입력</span>
              <div className="inline-flex p-1 rounded-lg bg-[#EFF2F7]">
                <button
                  type="button"
                  onClick={() => setInputBy('rate')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    inputBy === 'rate' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  환급률(%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDirectRefundAmount(analysis.expectedRefund);
                    setInputBy('amount');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    inputBy === 'amount' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  환급금(원)
                </button>
              </div>
            </div>

            {inputBy === 'rate' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={1}
                    min={10}
                    max={500}
                    value={targetRefundRate}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v) && v >= 0) setTargetRefundRate(v);
                    }}
                    aria-label="예상 환급률 퍼센트"
                    className="w-full px-3.5 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
                  />
                  <span className="text-sm font-semibold text-slate-600 shrink-0">%</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[100, 110, 120, 125, 130, 150].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRefundRate(r)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        targetRefundRate === r
                          ? 'bg-[#FDF0E8] text-[#B44112] border border-[#F2CBB2]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={500000}
                  min={0}
                  value={directRefundAmount}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) setDirectRefundAmount(v);
                  }}
                  aria-label="예상 환급금 금액"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
                />
                <span className="text-sm font-semibold text-slate-600 shrink-0">원</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 2. 결과 요약 + 설명 (+ Desktop Copy CTA) */}
      <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-6 space-y-4">
        <section className="rounded-2xl bg-[#EEF3FC] border border-[#DCE5F7] p-5">
          <div className="text-[15px] font-semibold text-slate-700 leading-snug">
            총 납입원금{' '}
            <span className="text-[#1D3B8B] font-bold">{formatKoreanUnits(analysis.totalPaid)}</span>
            을 {effectiveTotalYears}년 시점에 돌려받으면
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500">예상 환급금</div>
              <div className="text-[30px] sm:text-[34px] font-bold tracking-tight text-slate-950 tabular-nums leading-tight mt-0.5">
                {formatKoreanUnits(analysis.expectedRefund)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[22px] font-bold text-[#B44112] tabular-nums leading-tight">
                {analysis.refundRatePct.toFixed(1)}%
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5 tabular-nums">
                {analysis.netProfit >= 0 ? '+' : ''}
                {formatKoreanUnits(analysis.netProfit)}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#D7E2F6] grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-500">실제 연환산 수익률(IRR)</div>
              <div className="text-[18px] font-bold text-[#1D3B8B] tabular-nums mt-0.5">
                연 {analysis.annualIRR.toFixed(2)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">
                {isTaxFree ? '일반과세 예금 환산금리' : '물가 반영 실질 환급률'}
              </div>
              <div className="text-[18px] font-bold text-slate-900 tabular-nums mt-0.5">
                {isTaxFree
                  ? `세전 연 ${analysis.bankEquivalentRate.toFixed(2)}%`
                  : `${analysis.realRefundRatePct.toFixed(1)}%`}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-[#FDF0E8] border border-[#F6DEC9] p-5 text-[14px] leading-[1.68] text-[#432312] space-y-2.5">
          <p>
            환급률{' '}
            <strong className="font-bold text-[#B44112] tabular-nums">
              {analysis.refundRatePct.toFixed(1)}%
            </strong>
            는 총 납입금 대비 비율일 뿐, 매년 복리로 계산한 실제 수익률은{' '}
            <strong className="font-bold text-[#1D3B8B] tabular-nums">
              연 {analysis.annualIRR.toFixed(2)}%
            </strong>
            입니다.
          </p>
          {paymentType === 'monthly' && (
            <p>
              매달 나눠 내는 적립식은 모든 돈이 {effectiveTotalYears}년 내내 묶여 있는 것이 아니라
              평균 보유 기간이 더 짧기 때문에, 같은 125%라도 일시납보다 실제 연 수익률이 더 높게
              나옵니다.
            </p>
          )}
          <p>
            지난 10년 평균 물가(연 {OVERALL_CPI.exactAnnualRatePct}%)를 반영하면 {effectiveTotalYears}
            년 뒤 {formatKoreanUnits(analysis.expectedRefund)}의 오늘 구매력 가치는 약{' '}
            <strong className="font-bold text-slate-900 tabular-nums">
              {formatKoreanUnits(analysis.realValueToday)}
            </strong>
            ({analysis.realRefundRatePct.toFixed(1)}%) 수준입니다.
          </p>
        </section>

        <div className="hidden lg:block">
          <CopyKakaoButton getCopyText={getCopyText} />
        </div>
      </div>

      {/* 3. 수익성 한눈에 비교 (+ Mobile Copy CTA) */}
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-2 space-y-4">
        {/* Summary Metrics Table */}
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-3">
          <h2 className="text-[16px] font-bold text-slate-900">수익성 한눈에 비교</h2>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">총 납입 원금</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatWon(analysis.totalPaid)}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">예상 수령 환급금</span>
              <span className="font-bold text-[#1D3B8B] tabular-nums">
                {formatWon(analysis.expectedRefund)}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">단순 환급률 / 순수익</span>
              <span className="font-bold text-[#B44112] tabular-nums">
                {analysis.refundRatePct.toFixed(1)}% ({analysis.netProfit >= 0 ? '+' : ''}
                {formatWon(analysis.netProfit)})
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">연평균 복리 수익률 (IRR)</span>
              <span className="font-bold text-[#1D3B8B] tabular-nums">
                연 {analysis.annualIRR.toFixed(2)}%
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600">
                물가(연 {OVERALL_CPI.exactAnnualRatePct}%) 반영 오늘 가치
              </span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {formatWon(analysis.realValueToday)} ({analysis.realRefundRatePct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </section>

        <div className="lg:hidden">
          <CopyKakaoButton getCopyText={getCopyText} />
        </div>
      </div>
    </div>
  );
}
