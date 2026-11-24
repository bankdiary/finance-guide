import { useMemo, useState } from 'react';
import { formatKoreanUnits, formatManEok, formatWon } from '../utils/formatters';
import { CopyKakaoButton } from './CopyKakaoButton';

const PRINCIPAL_PRESETS = [
  { label: '1,000만 원', value: 10000000 },
  { label: '3,000만 원', value: 30000000 },
  { label: '5,000만 원', value: 50000000 },
  { label: '1억 원', value: 100000000 },
];

const RATE_PRESETS = [3.0, 5.0, 7.0, 10.0];
const YEAR_PRESETS = [5, 10, 20, 30];

export function InterestCompareTab() {
  const [principal, setPrincipal] = useState<number>(30000000);
  const [annualRate, setAnnualRate] = useState<number>(5.0);
  const [years, setYears] = useState<number>(20);
  const [isTaxFree, setIsTaxFree] = useState<boolean>(true);

  const result = useMemo(() => {
    const grossRate = annualRate / 100;
    const taxMultiplier = isTaxFree ? 1 : 1 - 0.154;

    // Simple interest: Principal + Principal * r * t (tax applied on interest)
    const simpleGrossInterest = principal * grossRate * years;
    const simpleInterest = simpleGrossInterest * taxMultiplier;
    const simpleTotal = principal + simpleInterest;

    // Compound interest: Principal * (1 + r)^t - Principal (tax applied on interest gain at maturity)
    const compoundGrossTotal = principal * Math.pow(1 + grossRate, years);
    const compoundGrossInterest = compoundGrossTotal - principal;
    const compoundInterest = compoundGrossInterest * taxMultiplier;
    const compoundTotal = principal + compoundInterest;

    const compoundBonus = compoundTotal - simpleTotal;
    const ruleOf72 = annualRate > 0 ? 72 / annualRate : 0;

    // Milestone comparison rows
    const step = years <= 10 ? 2 : 5;
    const points: number[] = [];
    for (let y = step; y < years; y += step) {
      points.push(y);
    }
    points.push(years);

    const milestones = points.map((y) => {
      const sInt = principal * grossRate * y * taxMultiplier;
      const cInt = (principal * Math.pow(1 + grossRate, y) - principal) * taxMultiplier;
      return {
        year: y,
        simpleTotal: principal + sInt,
        compoundTotal: principal + cInt,
        diff: cInt - sInt,
      };
    });

    return {
      simpleTotal,
      simpleInterest,
      compoundTotal,
      compoundInterest,
      compoundBonus,
      ruleOf72,
      milestones,
    };
  }, [principal, annualRate, years, isTaxFree]);

  const getCopyText = () => {
    const lines = [
      `[상담 재무계산기 · 단리 vs 복리 비교]`,
      ``,
      `■ 원금 ${formatManEok(principal)} · 연 ${annualRate.toFixed(1)}% · ${years}년 (${
        isTaxFree ? '비과세' : '일반과세 15.4%'
      })`,
      ``,
      `· 단리 최종 수령액: ${formatKoreanUnits(result.simpleTotal)} (이자 ${formatKoreanUnits(result.simpleInterest)})`,
      `· 복리 최종 수령액: ${formatKoreanUnits(result.compoundTotal)} (이자 ${formatKoreanUnits(result.compoundInterest)})`,
      `· 복리로 더 받는 금액: +${formatKoreanUnits(result.compoundBonus)}`,
      ``,
      `■ 72의 법칙: 연 ${annualRate.toFixed(1)}% 복리 시 원금 2배 기간 약 ${result.ruleOf72.toFixed(1)}년`,
    ];
    return lines.join('\n');
  };

  const maxChartTotal = Math.max(result.compoundTotal, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* 1. 조건 설정 (Mobile: 1st right under tab menu | Desktop: Right column top) */}
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-slate-900">조건 설정</h2>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="ic-principal" className="font-semibold text-slate-700">
                투자 원금
              </label>
              <span className="font-bold text-[#1D3B8B] tabular-nums">
                {formatManEok(principal)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRINCIPAL_PRESETS.map((p) => (
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
                id="ic-principal"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="ic-rate" className="font-semibold text-slate-700">
                  연 수익률 (이자율)
                </label>
                <span className="font-bold text-[#B44112] tabular-nums">
                  연 {annualRate.toFixed(1)}%
                </span>
              </div>
              <input
                id="ic-rate"
                type="range"
                min={0.5}
                max={15}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="ic-years" className="font-semibold text-slate-700">
                  운용 기간
                </label>
                <span className="font-bold text-slate-900 tabular-nums">{years}년</span>
              </div>
              <input
                id="ic-years"
                type="range"
                min={1}
                max={40}
                step={1}
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
          </div>
        </section>
      </div>

      {/* 2. 결과 요약 + 설명 (+ Desktop Copy CTA) */}
      <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-6 space-y-4">
        <section className="rounded-2xl bg-[#EEF3FC] border border-[#DCE5F7] p-5">
          <div className="text-[16px] sm:text-[17px] font-semibold text-slate-900 leading-snug">
            <span className="text-[#1D3B8B] font-bold">{formatManEok(principal)}</span>을 연{' '}
            <span className="text-[#1D3B8B] font-bold">{annualRate.toFixed(1)}%</span>로{' '}
            <span className="text-[#1D3B8B] font-bold">{years}년</span> 굴리면
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/80 border border-[#DCE5F7] p-3.5">
              <div className="text-xs font-medium text-slate-500">단리 최종 금액</div>
              <div className="mt-1 text-[20px] sm:text-[22px] font-bold text-slate-700 tabular-nums leading-tight">
                {formatKoreanUnits(result.simpleTotal)}
              </div>
              <div className="mt-1 text-xs text-slate-500 tabular-nums">
                이자 +{formatKoreanUnits(result.simpleInterest)}
              </div>
            </div>

            <div className="rounded-xl bg-white border border-[#B9CCEE] p-3.5">
              <div className="text-xs font-semibold text-[#1D3B8B]">복리 최종 금액</div>
              <div className="mt-1 text-[20px] sm:text-[22px] font-bold text-slate-950 tabular-nums leading-tight">
                {formatKoreanUnits(result.compoundTotal)}
              </div>
              <div className="mt-1 text-xs font-semibold text-[#B44112] tabular-nums">
                이자 +{formatKoreanUnits(result.compoundInterest)}
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-[#D7E2F6] flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">복리 효과 차이</span>
            <span className="font-bold text-[#B44112] text-[16px] tabular-nums">
              +{formatKoreanUnits(result.compoundBonus)} 더 많음
            </span>
          </div>
        </section>

        <section className="rounded-2xl bg-[#FDF0E8] border border-[#F6DEC9] p-5 text-[14px] leading-[1.68] text-[#432312] space-y-2.5">
          <p>
            단리는 원금({formatManEok(principal)})에만 이자가 붙지만, 복리는 불어난 이자에도 다시
            이자가 붙어 시간이 길어질수록 눈덩이처럼 차이가 벌어집니다.
          </p>
          <p>
            {years}년 뒤 복리 수령액은 단리보다{' '}
            <strong className="font-bold text-[#B44112] tabular-nums">
              {formatKoreanUnits(result.compoundBonus)}
            </strong>{' '}
            더 많습니다.
          </p>
          {annualRate > 0 && (
            <p>
              <strong>72의 법칙</strong>으로 계산하면 연 {annualRate.toFixed(1)}% 복리일 때 원금이
              2배가 되는 데 약{' '}
              <strong className="font-bold text-[#1D3B8B] tabular-nums">
                {result.ruleOf72.toFixed(1)}년
              </strong>
              (72 ÷ {annualRate.toFixed(1)})이 걸립니다.
            </p>
          )}
        </section>

        <div className="hidden lg:block">
          <CopyKakaoButton getCopyText={getCopyText} />
        </div>
      </div>

      {/* 3. 기간별 단리·복리 격차 (+ Mobile Copy CTA) */}
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-2 space-y-4">
        {/* Growth Curve Bar Comparison */}
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-bold text-slate-900">기간별 단리·복리 격차</h2>
            <span className="text-xs text-slate-500">
              {isTaxFree ? '비과세 기준' : '일반과세 15.4% 차감 후'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8C93A4]" aria-hidden="true" />
              <span>단리 합계</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#BA3F13]" aria-hidden="true" />
              <span>복리 합계</span>
            </div>
          </div>

          <div className="space-y-3">
            {result.milestones.map((m) => {
              const simpleWidth = (m.simpleTotal / maxChartTotal) * 100;
              const compoundWidth = (m.compoundTotal / maxChartTotal) * 100;
              const isFinal = m.year === years;

              return (
                <div
                  key={m.year}
                  className={`rounded-xl p-3 ${
                    isFinal ? 'bg-[#F3F6FC] border border-[#DCE5F7]' : 'bg-[#FAFBFD]'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900 tabular-nums">{m.year}년 차</span>
                    <span className="text-xs font-semibold text-[#B44112] tabular-nums">
                      차이 +{formatWon(m.diff)}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 text-xs text-slate-500 shrink-0">단리</span>
                      <div className="flex-1 h-2 rounded-full bg-[#EAEEF5] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#8C93A4] transition-all duration-300"
                          style={{ width: `${simpleWidth}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 tabular-nums w-24 text-right shrink-0">
                        {formatKoreanUnits(m.simpleTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="w-8 text-xs font-semibold text-[#B44112] shrink-0">복리</span>
                      <div className="flex-1 h-2 rounded-full bg-[#EAEEF5] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#BA3F13] transition-all duration-300"
                          style={{ width: `${compoundWidth}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-950 tabular-nums w-24 text-right shrink-0">
                        {formatKoreanUnits(m.compoundTotal)}
                      </span>
                    </div>
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
