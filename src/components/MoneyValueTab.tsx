import { useMemo, useState } from 'react';
import { OVERALL_CPI } from '../data/financialData';
import { formatKoreanUnits, formatManEok, formatWon } from '../utils/formatters';
import { CopyKakaoButton } from './CopyKakaoButton';

const AMOUNT_PRESETS = [
  { label: '1,000만 원', value: 10000000 },
  { label: '5,000만 원', value: 50000000 },
  { label: '1억 원', value: 100000000 },
  { label: '3억 원', value: 300000000 },
];

const YEAR_PRESETS = [5, 10, 15, 20, 30];

const INFLATION_PRESETS = [
  { label: '2.0%', value: 2.0 },
  { label: '2.28% (10년 평균)', value: OVERALL_CPI.exactAnnualRatePct },
  { label: '3.0%', value: 3.0 },
  { label: '4.0%', value: 4.0 },
];

export function MoneyValueTab() {
  const [principal, setPrincipal] = useState<number>(100000000);
  const [years, setYears] = useState<number>(20);
  const [inflationRate, setInflationRate] = useState<number>(OVERALL_CPI.exactAnnualRatePct);
  const [depositRate, setDepositRate] = useState<number>(2.5);

  const calculations = useMemo(() => {
    const inf = inflationRate / 100;
    const realValue = principal / Math.pow(1 + inf, years);
    const lostValue = principal - realValue;
    const realPct = (realValue / principal) * 100;
    const lossPct = 100 - realPct;

    // Required nominal amount to maintain today's purchasing power
    const requiredFutureNominal = principal * Math.pow(1 + inf, years);

    // If kept in a bank deposit (after 15.4% interest tax)
    const afterTaxDepRate = (depositRate / 100) * (1 - 0.154);
    const nominalWithDeposit = principal * Math.pow(1 + afterTaxDepRate, years);
    const realValueWithDeposit = nominalWithDeposit / Math.pow(1 + inf, years);

    // Yearly timeline milestones (every 5 years + target year)
    const milestoneYears = Array.from(
      new Set([5, 10, 15, 20, 25, 30].filter((y) => y <= Math.max(years, 10)))
    );
    if (!milestoneYears.includes(years)) {
      milestoneYears.push(years);
    }
    milestoneYears.sort((a, b) => a - b);

    const timeline = milestoneYears.map((y) => {
      const rv = principal / Math.pow(1 + inf, y);
      const depNom = principal * Math.pow(1 + afterTaxDepRate, y);
      const depReal = depNom / Math.pow(1 + inf, y);
      const rvPct = (rv / principal) * 100;
      return {
        year: y,
        realValue: rv,
        realPct: rvPct,
        depositRealValue: depReal,
        depositRealPct: (depReal / principal) * 100,
      };
    });

    return {
      realValue,
      lostValue,
      realPct,
      lossPct,
      requiredFutureNominal,
      nominalWithDeposit,
      realValueWithDeposit,
      timeline,
    };
  }, [principal, years, inflationRate, depositRate]);

  const getCopyText = () => {
    const lines = [
      `[상담 재무계산기 · 돈의 가치(구매력) 계산]`,
      ``,
      `■ 현재 보유 현금: ${formatManEok(principal)}`,
      `■ 기간 및 물가: ${years}년 뒤 · 물가상승률 연 ${inflationRate.toFixed(2)}% 기준`,
      ``,
      `· ${years}년 뒤 실질 구매력: ${formatKoreanUnits(calculations.realValue)} (-${calculations.lossPct.toFixed(1)}%)`,
      `· 줄어드는 체감 가치: 약 ${formatKoreanUnits(calculations.lostValue)} 감소`,
      `· 오늘 가치를 유지하려면 필요한 금액: ${formatKoreanUnits(calculations.requiredFutureNominal)}`,
      ``,
      `■ 세전 연 ${depositRate.toFixed(1)}% 예금(일반과세 15.4%)에 넣어둘 경우`,
      `· 세후 통장 잔액: ${formatKoreanUnits(calculations.nominalWithDeposit)}`,
      `· 물가 반영 실질 가치: ${formatKoreanUnits(calculations.realValueWithDeposit)}`,
    ];
    return lines.join('\n');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* 1. 조건 설정 (Mobile: 1st right under tab menu | Desktop: Right column top) */}
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-5">
          <h2 className="text-[16px] font-bold text-slate-900">조건 설정</h2>

          {/* Principal Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="mv-principal" className="font-semibold text-slate-700">
                현재 보유 금액
              </label>
              <span className="font-bold text-[#1D3B8B] tabular-nums">
                {formatManEok(principal)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AMOUNT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPrincipal(p.value)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    principal === p.value
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
                id="mv-principal"
                type="number"
                step={1000000}
                min={100000}
                value={principal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v >= 0) setPrincipal(v);
                }}
                className="w-full px-3.5 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
              />
              <span className="text-sm font-medium text-slate-500 shrink-0">원</span>
            </div>
          </div>

          {/* Years Slider + Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="mv-years" className="font-semibold text-slate-700">
                경과 기간
              </label>
              <span className="font-bold text-slate-900 tabular-nums">{years}년</span>
            </div>
            <input
              id="mv-years"
              type="range"
              min={1}
              max={40}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full calc-slider"
            />
            <div className="flex flex-wrap gap-1.5">
              {YEAR_PRESETS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYears(y)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    years === y
                      ? 'bg-[#1D3B8B] text-white'
                      : 'bg-[#EFF2F7] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {y}년
                </button>
              ))}
            </div>
          </div>

          {/* Inflation Rate + Deposit Comparison Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="mv-inf" className="font-semibold text-slate-700">
                  예상 물가상승률
                </label>
                <span className="font-bold text-[#B44112] tabular-nums">
                  연 {inflationRate.toFixed(2)}%
                </span>
              </div>
              <input
                id="mv-inf"
                type="number"
                step={0.1}
                min={0}
                max={15}
                value={inflationRate}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v >= 0 && v <= 20) setInflationRate(v);
                }}
                className="w-full px-3.5 py-2 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
              />
              <div className="flex flex-wrap gap-1.5">
                {INFLATION_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setInflationRate(p.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      Math.abs(inflationRate - p.value) < 0.01
                        ? 'bg-[#FDF0E8] text-[#B44112] border border-[#F2CBB2]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="mv-dep" className="font-semibold text-slate-700">
                  비교 예금금리 (세전)
                </label>
                <span className="font-bold text-[#1D3B8B] tabular-nums">
                  연 {depositRate.toFixed(1)}%
                </span>
              </div>
              <input
                id="mv-dep"
                type="number"
                step={0.1}
                min={0}
                max={15}
                value={depositRate}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v >= 0 && v <= 20) setDepositRate(v);
                }}
                className="w-full px-3.5 py-2 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
              />
              <p className="text-xs text-slate-500 tabular-nums">
                이자소득세 15.4% 제외 세후 연 {(depositRate * 0.846).toFixed(2)}% 적용
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 2. 결과 요약 + 설명 (+ Desktop Copy CTA) */}
      <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-6 space-y-4">
        <section className="rounded-2xl bg-[#EEF3FC] border border-[#DCE5F7] p-5">
          <div className="text-[16px] sm:text-[17px] font-semibold text-slate-900 leading-snug">
            <span className="text-[#1D3B8B] font-bold">{years}년 뒤</span>, 오늘의{' '}
            <span className="text-[#1D3B8B] font-bold">{formatManEok(principal)}</span>으로 살 수
            있는 가치는
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-3">
            <div className="text-[30px] sm:text-[34px] font-bold tracking-tight text-slate-950 tabular-nums leading-none">
              {formatKoreanUnits(calculations.realValue)}
            </div>
            <div className="text-right shrink-0">
              <div className="text-[18px] font-bold text-[#B44112] tabular-nums leading-tight">
                구매력 -{calculations.lossPct.toFixed(1)}%
              </div>
              <div className="text-[13px] font-semibold text-[#B44112] tabular-nums mt-0.5">
                물가 연 +{inflationRate.toFixed(2)}%
              </div>
            </div>
          </div>

          <p className="mt-3 text-[13px] text-slate-600 tabular-nums">
            오늘 {formatManEok(principal)}의 생활 수준을 {years}년 뒤에도 유지하려면{' '}
            <strong className="text-slate-900">
              {formatKoreanUnits(calculations.requiredFutureNominal)}
            </strong>
            이 필요합니다.
          </p>
        </section>

        <section className="rounded-2xl bg-[#FDF0E8] border border-[#F6DEC9] p-5 text-[14px] leading-[1.68] text-[#432312] space-y-2.5">
          <p>
            통장에 적힌 숫자는 {years}년 뒤에도 그대로{' '}
            <strong className="font-bold text-slate-900">{formatManEok(principal)}</strong>
            이지만, 물가가 해마다 {inflationRate.toFixed(2)}%씩 오르면 실제로 살 수 있는 양은{' '}
            <strong className="font-bold text-[#B44112] tabular-nums">
              {formatKoreanUnits(calculations.realValue)}
            </strong>
            어치로 줄어듭니다.
          </p>
          <p>
            즉, 현금 그대로 두는 것만으로도 {years}년 동안 약{' '}
            <strong className="font-bold text-[#B44112] tabular-nums">
              {formatKoreanUnits(calculations.lostValue)}
            </strong>
            의 구매력이 보이지 않게 빠져나갑니다.
          </p>
          <p>
            반대로 세전 연 {depositRate.toFixed(1)}% 예금(일반과세 15.4% 차감 후 세후{' '}
            {(depositRate * 0.846).toFixed(2)}%)에 두면 실질 가치는{' '}
            <strong className="font-bold text-[#1D3B8B] tabular-nums">
              {formatKoreanUnits(calculations.realValueWithDeposit)}
            </strong>
            이 됩니다.
          </p>
        </section>

        <div className="hidden lg:block">
          <CopyKakaoButton getCopyText={getCopyText} />
        </div>
      </div>

      {/* 3. 기간별 구매력 변화 (+ Mobile Copy CTA) */}
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-2 space-y-4">
        {/* Purchasing Power Decay Timeline */}
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-slate-900">기간별 구매력 변화</h2>
            <span className="text-xs text-slate-500">현재 {formatManEok(principal)} 기준</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#BA3F13]" aria-hidden="true" />
              <span>현금 보유 시 실질 가치</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1D3B8B]" aria-hidden="true" />
              <span>예금(세전 {depositRate.toFixed(1)}%) 실질 가치</span>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {calculations.timeline.map((row) => {
              const isSelectedYear = row.year === years;
              return (
                <div
                  key={row.year}
                  className={`rounded-xl p-3 transition-colors ${
                    isSelectedYear ? 'bg-[#F3F6FC] border border-[#DCE5F7]' : 'bg-[#FAFBFD]'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900 tabular-nums">{row.year}년 뒤</span>
                    <div className="text-right tabular-nums">
                      <span className="font-bold text-[#B44112]">
                        {formatWon(row.realValue)}
                      </span>
                      <span className="text-xs text-slate-500 ml-1.5">
                        ({row.realPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Cash real value bar */}
                  <div className="mt-2 h-2 w-full rounded-full bg-[#EAEEF5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#BA3F13] transition-all duration-300"
                      style={{ width: `${Math.min(100, row.realPct)}%` }}
                    />
                  </div>

                  {/* Deposit real value bar */}
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                    <span>예금 실질 가치</span>
                    <span className="font-semibold text-[#1D3B8B]">
                      {formatWon(row.depositRealValue)} ({row.depositRealPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[#EAEEF5] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1D3B8B] transition-all duration-300"
                      style={{ width: `${Math.min(100, row.depositRealPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="lg:hidden">
          <CopyKakaoButton getCopyText={getCopyText} />
        </div>
      </div>
    </div>
  );
}
