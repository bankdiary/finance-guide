import { useMemo, useState } from 'react';
import { formatKoreanUnits, formatManEok, formatWon } from '../utils/formatters';
import { CopyKakaoButton } from './CopyKakaoButton';

type SavingsMode = 'monthlyToLump' | 'lumpToMonthly';

const MONTHLY_PRESETS = [
  { label: '30만 원', value: 300000 },
  { label: '50만 원', value: 500000 },
  { label: '100만 원', value: 1000000 },
  { label: '200만 원', value: 2000000 },
];

const TARGET_PRESETS = [
  { label: '5,000만 원', value: 50000000 },
  { label: '1억 원', value: 100000000 },
  { label: '3억 원', value: 300000000 },
  { label: '5억 원', value: 500000000 },
];

const YEAR_PRESETS = [3, 5, 10, 15, 20];
const RATE_PRESETS = [2.5, 4.0, 6.0, 8.0];

function calcFutureValueMonthly(monthly: number, annualRatePct: number, years: number, isTaxFree: boolean) {
  const months = years * 12;
  const principal = monthly * months;
  if (annualRatePct <= 0) {
    return { total: principal, principal, interest: 0 };
  }
  const rm = annualRatePct / 100 / 12;
  // Beginning-of-month deposits compounded monthly
  const grossTotal = monthly * ((Math.pow(1 + rm, months) - 1) / rm) * (1 + rm);
  const grossInterest = grossTotal - principal;
  const netInterest = isTaxFree ? grossInterest : grossInterest * (1 - 0.154);
  return {
    total: principal + netInterest,
    principal,
    interest: netInterest,
  };
}

function calcRequiredMonthlyForTarget(
  target: number,
  annualRatePct: number,
  years: number,
  isTaxFree: boolean
) {
  const months = years * 12;
  if (months <= 0) return 0;
  if (annualRatePct <= 0) return target / months;

  const rm = annualRatePct / 100 / 12;
  const factor = ((Math.pow(1 + rm, months) - 1) / rm) * (1 + rm);

  if (isTaxFree) {
    return target / factor;
  }
  // Net Total = P * months + (P * factor - P * months) * (1 - 0.154)
  // = P * (months * 0.154 + factor * 0.846)
  const netFactor = months * 0.154 + factor * 0.846;
  return target / netFactor;
}

export function SavingsGoalTab() {
  const [mode, setMode] = useState<SavingsMode>('monthlyToLump');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500000);
  const [targetAmount, setTargetAmount] = useState<number>(100000000);
  const [years, setYears] = useState<number>(10);
  const [annualRate, setAnnualRate] = useState<number>(4.0);
  const [isTaxFree, setIsTaxFree] = useState<boolean>(false);

  const mainResult = useMemo(() => {
    if (mode === 'monthlyToLump') {
      const res = calcFutureValueMonthly(monthlyAmount, annualRate, years, isTaxFree);
      const principalPct = res.total > 0 ? (res.principal / res.total) * 100 : 100;
      const interestPct = 100 - principalPct;

      // Delay comparison: starting 1, 3, 5 years later (when years > delay)
      const delays = [1, 3, 5]
        .filter((d) => years - d >= 1)
        .map((delay) => {
          const remainYears = years - delay;
          const delayedRes = calcFutureValueMonthly(monthlyAmount, annualRate, remainYears, isTaxFree);
          return {
            delayYears: delay,
            remainYears,
            total: delayedRes.total,
            gap: res.total - delayedRes.total,
          };
        });

      return {
        mode: 'monthlyToLump' as const,
        finalTotal: res.total,
        principal: res.principal,
        interest: res.interest,
        principalPct,
        interestPct,
        delays,
      };
    }

    const reqMonthly = calcRequiredMonthlyForTarget(targetAmount, annualRate, years, isTaxFree);
    const totalPrincipal = reqMonthly * years * 12;
    const totalInterest = Math.max(0, targetAmount - totalPrincipal);
    const principalPct = targetAmount > 0 ? (totalPrincipal / targetAmount) * 100 : 100;
    const interestPct = 100 - principalPct;

    const delays = [1, 3, 5]
      .filter((d) => years - d >= 1)
      .map((delay) => {
        const remainYears = years - delay;
        const delayedMonthly = calcRequiredMonthlyForTarget(
          targetAmount,
          annualRate,
          remainYears,
          isTaxFree
        );
        return {
          delayYears: delay,
          remainYears,
          monthly: delayedMonthly,
          extraMonthly: delayedMonthly - reqMonthly,
        };
      });

    return {
      mode: 'lumpToMonthly' as const,
      requiredMonthly: reqMonthly,
      principal: totalPrincipal,
      interest: totalInterest,
      principalPct,
      interestPct,
      delays,
    };
  }, [mode, monthlyAmount, targetAmount, years, annualRate, isTaxFree]);

  const getCopyText = () => {
    const taxLabel = isTaxFree ? '비과세' : '일반과세 15.4%';
    if (mainResult.mode === 'monthlyToLump') {
      const lines = [
        `[상담 재무계산기 · 목돈 마련 계산]`,
        ``,
        `■ 매월 ${formatManEok(monthlyAmount)}씩 ${years}년 적립 (연 ${annualRate.toFixed(1)}% · ${taxLabel})`,
        ``,
        `· 예상 만기 수령액: ${formatKoreanUnits(mainResult.finalTotal)}`,
        `· 납입 원금 합계: ${formatKoreanUnits(mainResult.principal)}`,
        `· 세후 이자 수익: +${formatKoreanUnits(mainResult.interest)}`,
      ];
      if (mainResult.delays.length > 0) {
        const d3 = mainResult.delays.find((d) => d.delayYears === 3) ?? mainResult.delays[0];
        lines.push(``);
        lines.push(
          `■ 시작을 ${d3.delayYears}년 미루면(${d3.remainYears}년 적립): ${formatKoreanUnits(
            d3.total
          )} (약 ${formatKoreanUnits(d3.gap)} 감소)`
        );
      }
      return lines.join('\n');
    }

    const lines = [
      `[상담 재무계산기 · 목표 목돈 역산]`,
      ``,
      `■ 목표 금액 ${formatManEok(targetAmount)} · ${years}년 (연 ${annualRate.toFixed(1)}% · ${taxLabel})`,
      ``,
      `· 매달 필요한 저축액: 월 ${formatWon(mainResult.requiredMonthly)}`,
      `· 총 납입 원금: ${formatKoreanUnits(mainResult.principal)}`,
      `· 이자로 채워지는 금액: +${formatKoreanUnits(mainResult.interest)}`,
    ];
    if (mainResult.delays.length > 0) {
      const d3 = mainResult.delays.find((d) => d.delayYears === 3) ?? mainResult.delays[0];
      lines.push(``);
      lines.push(
        `■ 시작을 ${d3.delayYears}년 미루면(${d3.remainYears}년): 월 ${formatWon(
          d3.monthly
        )} 필요 (매달 +${formatWon(d3.extraMonthly)} 부담 증가)`
      );
    }
    return lines.join('\n');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Hero Summary + Explanation + Copy CTA */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
        <section className="rounded-2xl bg-[#EEF3FC] border border-[#DCE5F7] p-5">
          {mainResult.mode === 'monthlyToLump' ? (
            <>
              <div className="text-[16px] sm:text-[17px] font-semibold text-slate-900 leading-snug">
                매달 <span className="text-[#1D3B8B] font-bold">{formatManEok(monthlyAmount)}</span>
                씩 <span className="text-[#1D3B8B] font-bold">{years}년</span> 모으면 (연{' '}
                {annualRate.toFixed(1)}%)
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <div className="text-[30px] sm:text-[34px] font-bold tracking-tight text-slate-950 tabular-nums leading-none">
                  {formatKoreanUnits(mainResult.finalTotal)}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[16px] font-bold text-[#B44112] tabular-nums">
                    이자 +{formatKoreanUnits(mainResult.interest)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {isTaxFree ? '비과세 기준' : '일반과세 15.4% 후'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-[16px] sm:text-[17px] font-semibold text-slate-900 leading-snug">
                <span className="text-[#1D3B8B] font-bold">{years}년</span> 안에{' '}
                <span className="text-[#1D3B8B] font-bold">{formatManEok(targetAmount)}</span>을
                모으려면
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <div className="text-[30px] sm:text-[34px] font-bold tracking-tight text-slate-950 tabular-nums leading-none">
                  월 {formatWon(mainResult.requiredMonthly)}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[15px] font-bold text-[#B44112] tabular-nums">
                    연 {annualRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {isTaxFree ? '비과세 기준' : '일반과세 15.4% 후'}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Stacked Principal vs Interest Ratio Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="h-2.5 w-full rounded-full bg-[#DCE4F3] overflow-hidden flex">
              <div
                className="h-full bg-[#1D3B8B] transition-all duration-300"
                style={{ width: `${mainResult.principalPct}%` }}
              />
              <div
                className="h-full bg-[#BA3F13] transition-all duration-300"
                style={{ width: `${mainResult.interestPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="text-slate-700 font-medium">
                원금 {formatKoreanUnits(mainResult.principal)} ({mainResult.principalPct.toFixed(1)}%)
              </span>
              <span className="text-[#B44112] font-semibold">
                수익 {formatKoreanUnits(mainResult.interest)} ({mainResult.interestPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-[#FDF0E8] border border-[#F6DEC9] p-5 text-[14px] leading-[1.68] text-[#432312] space-y-2.5">
          {mainResult.mode === 'monthlyToLump' ? (
            <>
              <p>
                {years}년 동안 내가 직접 낸 원금은{' '}
                <strong className="font-bold text-slate-900 tabular-nums">
                  {formatKoreanUnits(mainResult.principal)}
                </strong>
                이고, 시간이 만들어준 이자 수익이{' '}
                <strong className="font-bold text-[#B44112] tabular-nums">
                  {formatKoreanUnits(mainResult.interest)}
                </strong>
                입니다.
              </p>
              <p>
                매달 같은 금액을 적립하더라도 일찍 시작할수록 복리 기간이 늘어나 목표 금액에 훨씬
                수월하게 도달합니다.
              </p>
            </>
          ) : (
            <>
              <p>
                목표 금액 {formatManEok(targetAmount)} 중{' '}
                <strong className="font-bold text-slate-900 tabular-nums">
                  {formatKoreanUnits(mainResult.principal)}
                </strong>
                은 매달 저축으로 모으고, 나머지{' '}
                <strong className="font-bold text-[#B44112] tabular-nums">
                  {formatKoreanUnits(mainResult.interest)}
                </strong>
                은 수익률이 채워주는 구조입니다.
              </p>
              <p>
                목표 시점이 정해져 있다면 시작을 몇 년만 미뤄도 매달 필요한 저축액이 크게
                늘어납니다.
              </p>
            </>
          )}
        </section>

        <div className="hidden lg:block">
          <CopyKakaoButton getCopyText={getCopyText} />
        </div>
      </div>

      {/* Right Column: Mode & Controls + Cost of Delay Comparison */}
      <div className="lg:col-span-7 space-y-4">
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-5">
          {/* Mode Segmented Toggle */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#EFF2F7]">
            <button
              type="button"
              onClick={() => setMode('monthlyToLump')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'monthlyToLump'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              월 적립 → 미래 목돈
            </button>
            <button
              type="button"
              onClick={() => setMode('lumpToMonthly')}
              className={`min-h-[42px] px-3 py-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                mode === 'lumpToMonthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              목표 목돈 → 월 필요액
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-slate-900">
              {mode === 'monthlyToLump' ? '매월 저축액 설정' : '목표 금액 설정'}
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
                일반과세 15.4%
              </button>
            </div>
          </div>

          {mode === 'monthlyToLump' ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {MONTHLY_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setMonthlyAmount(p.value)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      monthlyAmount === p.value
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
                  step={100000}
                  min={10000}
                  value={monthlyAmount}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) setMonthlyAmount(v);
                  }}
                  aria-label="매월 저축액"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
                />
                <span className="text-sm font-medium text-slate-500 shrink-0">원/월</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {TARGET_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setTargetAmount(p.value)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      targetAmount === p.value
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
                  step={5000000}
                  min={1000000}
                  value={targetAmount}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) setTargetAmount(v);
                  }}
                  aria-label="목표 목돈 금액"
                  className="w-full px-3.5 py-2.5 text-sm font-semibold tabular-nums rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
                />
                <span className="text-sm font-medium text-slate-500 shrink-0">원</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="sg-years" className="font-semibold text-slate-700">
                  저축 기간
                </label>
                <span className="font-bold text-slate-900 tabular-nums">{years}년</span>
              </div>
              <input
                id="sg-years"
                type="range"
                min={1}
                max={35}
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
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                      years === y
                        ? 'bg-[#1D3B8B] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {y}년
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="sg-rate" className="font-semibold text-slate-700">
                  연 수익률 (월 복리)
                </label>
                <span className="font-bold text-[#B44112] tabular-nums">
                  연 {annualRate.toFixed(1)}%
                </span>
              </div>
              <input
                id="sg-rate"
                type="range"
                min={0.5}
                max={12}
                step={0.5}
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full calc-slider"
              />
              <div className="flex flex-wrap gap-1.5">
                {RATE_PRESETS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAnnualRate(r)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                      annualRate === r
                        ? 'bg-[#1D3B8B] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cost of Delay Card */}
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-slate-900">
              시작을 미루면 어떻게 달라질까요?
            </h2>
            <span className="text-xs text-slate-500">같은 목표 시점 기준</span>
          </div>

          {mainResult.delays.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">
              기간을 2년 이상으로 설정하면 지연 시 비교 결과를 확인할 수 있습니다.
            </p>
          ) : (
            <div className="space-y-2.5">
              {mainResult.mode === 'monthlyToLump'
                ? mainResult.delays.map((d) => (
                    <div
                      key={d.delayYears}
                      className="rounded-xl bg-[#FAFBFD] border border-slate-100 p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {d.delayYears}년 뒤 시작 ({d.remainYears}년 적립)
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          만기 예상액 {formatKoreanUnits(d.total)}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-bold text-[#B44112]">
                          -{formatKoreanUnits(d.gap)}
                        </div>
                        <div className="text-xs text-slate-500">지금보다 손해</div>
                      </div>
                    </div>
                  ))
                : mainResult.delays.map((d) => (
                    <div
                      key={d.delayYears}
                      className="rounded-xl bg-[#FAFBFD] border border-slate-100 p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {d.delayYears}년 뒤 시작 ({d.remainYears}년 남음)
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                          필요 적립액 월 {formatWon(d.monthly)}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-bold text-[#B44112]">
                          매달 +{formatWon(d.extraMonthly)}
                        </div>
                        <div className="text-xs text-slate-500">추가 부담</div>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </section>

        <div className="lg:hidden">
          <CopyKakaoButton getCopyText={getCopyText} />
        </div>
      </div>
    </div>
  );
}
