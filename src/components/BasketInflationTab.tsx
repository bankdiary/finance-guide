import { Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  BASKET_BASE_PRESETS,
  BASKET_ITEMS,
  CATEGORY_ORDER,
  OVERALL_CPI,
  type BasketItem,
} from '../data/financialData';
import { formatManEok, formatWon } from '../utils/formatters';
import { CopyKakaoButton } from './CopyKakaoButton';

type SortMode = 'highest' | 'category';

const MAX_BAR_PCT = 82;
const AVG_MARKER_POS_PCT = (OVERALL_CPI.change10yPct / MAX_BAR_PCT) * 100;

export function BasketInflationTab() {
  const [baseAmount, setBaseAmount] = useState<number>(10000);
  const [editingAmount, setEditingAmount] = useState<boolean>(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('10000');
  const [sortMode, setSortMode] = useState<SortMode>('highest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectedId, setInspectedId] = useState<string>('kimbap');
  const [show20Year, setShow20Year] = useState<boolean>(false);

  const overall2026 = Math.round(baseAmount * OVERALL_CPI.ratio10y);

  const inspectedItem = useMemo<BasketItem>(
    () => BASKET_ITEMS.find((item) => item.id === inspectedId) ?? BASKET_ITEMS[0],
    [inspectedId]
  );

  const inspectedLinearPct = useMemo(
    () => (inspectedItem.change10yPct / 10).toFixed(2),
    [inspectedItem]
  );

  const inspectedSimpleSumPct = useMemo(
    () => Math.round(inspectedItem.cagrPct * 10),
    [inspectedItem]
  );

  const toggleSelectItem = (id: string) => {
    setInspectedId(id);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyCustomAmount = () => {
    const parsed = Number(customAmountInput.replace(/[^0-9]/g, ''));
    if (parsed >= 100 && parsed <= 1000000000) {
      setBaseAmount(parsed);
    }
    setEditingAmount(false);
  };

  // 20-year future projection from 2026 to 2046
  const future20RateFactor = Math.pow(1 + OVERALL_CPI.exactAnnualRatePct / 100, 20);
  const overall2046FromBase = Math.round(baseAmount * future20RateFactor);
  const overall2046FromToday = Math.round(overall2026 * future20RateFactor);

  const selectedItems = useMemo(
    () => BASKET_ITEMS.filter((item) => selectedIds.includes(item.id)),
    [selectedIds]
  );

  const projectionSampleItems = useMemo(() => {
    if (selectedItems.length > 0) return selectedItems;
    return [BASKET_ITEMS[0], BASKET_ITEMS[1], BASKET_ITEMS[14]]; // 김밥, 달걀, 커피(외식)
  }, [selectedItems]);

  const groupedByCategory = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: BASKET_ITEMS.filter((item) => item.category === category).sort(
        (a, b) => b.change10yPct - a.change10yPct
      ),
    }));
  }, []);

  const getCopyText = () => {
    const baseLabel = formatManEok(baseAmount);
    const lines: string[] = [
      `[상담 재무계산기 · 장바구니 물가 비교]`,
      ``,
      `■ ${OVERALL_CPI.baseYearLabel} ${baseLabel} → ${OVERALL_CPI.targetYearLabel} ${formatWon(overall2026)}`,
      `· 전체 물가 평균: 10년 +${OVERALL_CPI.change10yPct}% (해마다 +${OVERALL_CPI.cagrDisplayPct}%)`,
    ];

    const itemsToCopy =
      selectedItems.length > 0 ? selectedItems : BASKET_ITEMS.slice(0, 3);

    lines.push(``);
    lines.push(
      selectedItems.length > 0
        ? `■ 선택하신 품목 기준 (${selectedItems.length}개)`
        : `■ 주요 상승 품목 예시 (상위 3개)`
    );

    itemsToCopy.forEach((item) => {
      const itemPrice = Math.round(baseAmount * item.ratio10y);
      lines.push(
        `· ${item.name}(${item.category}): ${formatWon(itemPrice)} (10년 +${item.change10yPct}% · 연 +${item.cagrPct}%)`
      );
    });

    if (show20Year) {
      lines.push(``);
      lines.push(
        `■ 이 속도로 앞으로 20년 후 (연 ${OVERALL_CPI.exactAnnualRatePct}% 기준)`
      );
      lines.push(
        `· 오늘 ${baseLabel} 기준 → 20년 후 ${formatWon(overall2046FromBase)} (+${((future20RateFactor - 1) * 100).toFixed(1)}%)`
      );
      lines.push(
        `· 2026년 ${formatWon(overall2026)} 기준 → 2046년 ${formatWon(overall2046FromToday)}`
      );
    }

    lines.push(``);
    lines.push(
      `※ 자료: 국가데이터처(옛 통계청) 「소비자물가조사」 (2016.10 대비 2026.10)`
    );

    return lines.join('\n');
  };

  const renderItemRow = (item: BasketItem) => {
    const isChecked = selectedIds.includes(item.id);
    const isInspected = inspectedId === item.id;
    const isAboveAverage = item.change10yPct >= OVERALL_CPI.change10yPct;
    const calculatedPrice = Math.round(baseAmount * item.ratio10y);
    const barWidthPct = Math.min(100, (item.change10yPct / MAX_BAR_PCT) * 100);

    return (
      <div
        key={item.id}
        onClick={() => toggleSelectItem(item.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSelectItem(item.id);
          }
        }}
        aria-pressed={isChecked}
        className={`group rounded-xl px-3.5 py-3 transition-colors duration-150 cursor-pointer select-none border ${
          isChecked
            ? 'bg-[#F0F4FC] border-[#C5D5F5]'
            : isInspected
            ? 'bg-[#F3F5F9] border-transparent'
            : 'bg-transparent border-transparent hover:bg-[#F6F8FC]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-[22px] h-[22px] rounded-md flex items-center justify-center shrink-0 transition-colors ${
                isChecked
                  ? 'bg-[#1D3B8B] border border-[#1D3B8B] text-white'
                  : 'bg-white border border-slate-300 group-hover:border-[#1D3B8B]'
              }`}
              aria-hidden="true"
            >
              {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            </span>
            <span className="font-semibold text-[15px] text-slate-900 truncate">
              {item.name}
            </span>
            <span className="text-xs text-slate-500 shrink-0">
              {item.category}
            </span>
          </div>

          <span className="font-bold text-[16px] text-slate-900 tabular-nums shrink-0">
            {formatWon(calculatedPrice)}
          </span>
        </div>

        <div className="mt-1.5 pl-[32px]">
          <p
            className={`text-[13px] font-medium tabular-nums ${
              isAboveAverage ? 'text-[#B44112]' : 'text-[#8C4527]'
            }`}
          >
            10년 +{item.change10yPct.toFixed(1)}% · 해마다 +{item.cagrPct.toFixed(1)}%
          </p>

          <div className="relative mt-2 h-2 w-full rounded-full bg-[#EAEEF5]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isAboveAverage ? 'bg-[#BA3F13]' : 'bg-[#8C93A4]'
              }`}
              style={{ width: `${barWidthPct}%` }}
            />
            <span
              aria-hidden="true"
              className="absolute top-[-3px] h-[14px] w-[1.5px] bg-slate-600/80"
              style={{ left: `${AVG_MARKER_POS_PCT}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column on Desktop: Hero Result + Dynamic Explanation + 20-Year Projection + Copy CTA */}
      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
        {/* Hero CPI Summary Card */}
        <section className="rounded-2xl bg-[#EEF3FC] border border-[#DCE5F7] p-5">
          <div className="text-[16px] sm:text-[17px] font-semibold text-slate-900 leading-snug">
            <span>{OVERALL_CPI.baseYearLabel}에 </span>
            <button
              type="button"
              onClick={() => {
                setCustomAmountInput(String(baseAmount));
                setEditingAmount((v) => !v);
              }}
              className="inline-flex items-center font-bold text-[#1D3B8B] underline decoration-[#1D3B8B]/40 underline-offset-4 hover:decoration-[#1D3B8B] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3B8B] rounded px-0.5"
              title="기준 금액 변경하기"
            >
              {formatManEok(baseAmount)}
            </button>
            <span>이던 물건이 {OVERALL_CPI.targetYearLabel}에는</span>
          </div>

          {/* Interactive Base Amount Editor (Collapsed by default to match screenshot, expands on click) */}
          {editingAmount && (
            <div className="mt-3 p-3 rounded-xl bg-white border border-[#D4E0F7] space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {BASKET_BASE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setBaseAmount(preset.value);
                      setCustomAmountInput(String(preset.value));
                      setEditingAmount(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      baseAmount === preset.value
                        ? 'bg-[#1D3B8B] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyCustomAmount();
                  }}
                  placeholder="직접 입력 (원)"
                  aria-label="기준 금액 직접 입력"
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm font-medium tabular-nums rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#1D3B8B]"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomAmount}
                  className="px-3 py-1.5 rounded-lg bg-[#1D3B8B] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  적용
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-baseline justify-between gap-3">
            <div className="text-[32px] sm:text-[36px] font-bold tracking-tight text-slate-950 tabular-nums leading-none">
              {formatWon(overall2026)}
            </div>
            <div className="text-right shrink-0">
              <div className="text-[18px] font-bold text-[#B44112] tabular-nums leading-tight">
                10년 +{OVERALL_CPI.change10yPct}%
              </div>
              <div className="text-[13px] font-semibold text-[#B44112] tabular-nums mt-0.5">
                해마다 +{OVERALL_CPI.cagrDisplayPct}%
              </div>
            </div>
          </div>

          <p className="mt-3 text-[13px] text-slate-600">
            전체 물가 평균 기준 · 흔히 말하는 물가상승률이 이 숫자입니다
          </p>
        </section>

        {/* Compound Inflation Explanation Callout (Warm Peach Surface) */}
        <section className="rounded-2xl bg-[#FDF0E8] border border-[#F6DEC9] p-5 text-[14px] leading-[1.68] text-[#432312] space-y-2.5">
          <p>
            {inspectedItem.name}은(는) 10년 동안{' '}
            <strong className="font-bold text-[#B44112] tabular-nums">
              {inspectedItem.change10yPct.toFixed(1)}%
            </strong>{' '}
            올랐습니다. 10년으로 나눈 {inspectedLinearPct}%씩이 아니라 해마다 약{' '}
            <strong className="font-bold text-[#B44112] tabular-nums">
              {inspectedItem.cagrPct.toFixed(1)}%
            </strong>
            씩 오른 결과입니다.
          </p>
          <p>
            오른 가격에 다시 오르는 복리라서 {inspectedItem.cagrPct.toFixed(1)}% × 10년 ={' '}
            {inspectedSimpleSumPct}%로 끝나지 않고 {inspectedItem.change10yPct.toFixed(1)}%가
            됩니다.
          </p>
          <p>
            전체 물가도 해마다 {OVERALL_CPI.cagrDisplayPct}%씩 올라 10년 동안{' '}
            {OVERALL_CPI.change10yPct}% 올랐습니다.
          </p>
        </section>

        {/* 20-Year Future Projection Card */}
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5">
          <p className="text-[14px] text-slate-700 leading-relaxed">
            지난 10년 평균 물가상승률 연{' '}
            <span className="font-semibold text-slate-900 tabular-nums">
              {OVERALL_CPI.exactAnnualRatePct}%
            </span>
            를 그대로 넣어 미래 금액을 계산합니다.
          </p>

          <button
            type="button"
            onClick={() => setShow20Year((prev) => !prev)}
            className="mt-3.5 w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#EEF3FC] hover:bg-[#E2EAFB] text-[#1D3B8B] font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3B8B]"
          >
            <span>이 속도로 앞으로 20년이면?</span>
            {show20Year ? (
              <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
          </button>

          {show20Year && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="rounded-xl bg-[#F7F9FD] p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">
                    오늘 {formatManEok(baseAmount)} 물건 → 20년 후 (전체 물가 평균)
                  </div>
                  <div className="text-[20px] font-bold text-slate-900 tabular-nums mt-0.5">
                    {formatWon(overall2046FromBase)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#B44112] tabular-nums">
                    20년 +{((future20RateFactor - 1) * 100).toFixed(1)}%
                  </span>
                  <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                    2026년 기준 시 {formatWon(overall2046FromToday)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  {selectedItems.length > 0
                    ? `고른 품목(${selectedItems.length}개)의 현재 속도로 20년 뒤 예상 가격`
                    : '대표 품목의 현재 속도로 20년 뒤 예상 가격 (2026년 대비)'}
                </div>
                {projectionSampleItems.map((item) => {
                  const price2026 = Math.round(baseAmount * item.ratio10y);
                  const factor20 = Math.pow(item.ratio10y, 2); // 10y ratio squared = 20y compounded
                  const price2046 = Math.round(price2026 * factor20);
                  const pct20y = (factor20 - 1) * 100;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="text-xs text-slate-400 tabular-nums">
                          (연 +{item.cagrPct}%)
                        </span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-bold text-slate-900">
                          {formatWon(price2046)}
                        </span>
                        <span className="ml-1.5 text-xs font-semibold text-[#B44112]">
                          +{pct20y.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Desktop Copy CTA & Citation (hidden on mobile where it appears at bottom below item list) */}
        <div className="hidden lg:block space-y-4">
          <CopyKakaoButton
            getCopyText={getCopyText}
            subInfo={
              selectedItems.length > 0
                ? `선택하신 ${selectedItems.length}개 품목이 복사 내용에 포함됩니다`
                : '품목을 고르지 않으면 상위 3개 품목이 자동으로 담깁니다'
            }
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            자료: 국가데이터처(옛 통계청) 「소비자물가조사」 품목별 소비자물가지수(2020=100) ·
            2016년 10월 대비 2026년 10월
          </p>
        </div>
      </div>

      {/* Right Column on Desktop: 15-Item Breakdown List */}
      <div className="lg:col-span-7 space-y-4">
        <section className="rounded-2xl bg-white border border-[#E5E9F2] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-bold text-slate-900">
              품목별로 보면 ({BASKET_ITEMS.length}개)
            </h2>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>선택 해제 ({selectedIds.length})</span>
              </button>
            )}
          </div>

          {/* Segmented Sort Control */}
          <div className="mt-3.5 grid grid-cols-2 p-1 rounded-xl bg-[#EFF2F7]">
            <button
              type="button"
              onClick={() => setSortMode('highest')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                sortMode === 'highest'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              많이 오른 순
            </button>
            <button
              type="button"
              onClick={() => setSortMode('category')}
              className={`min-h-[40px] px-3 py-2 rounded-lg text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                sortMode === 'category'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              분류별
            </button>
          </div>

          <p className="mt-3.5 text-[13px] text-slate-600">
            자주 사시는 품목을 눌러 고르면 아래 결과 복사에 담깁니다.
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[12px] text-slate-500 pb-2 border-b border-slate-100">
            <span className="inline-block w-[1.5px] h-3.5 bg-slate-600" aria-hidden="true" />
            <span>세로선은 전체 물가 평균(10년 +{OVERALL_CPI.change10yPct}%)</span>
          </div>

          {sortMode === 'highest' ? (
            <div className="mt-2 space-y-1">
              {BASKET_ITEMS.map((item) => renderItemRow(item))}
            </div>
          ) : (
            <div className="mt-3 space-y-5">
              {groupedByCategory.map((group) => (
                <div key={group.category} className="space-y-1">
                  <div className="px-2 py-1 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <span>{group.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{group.items.length}개</span>
                  </div>
                  {group.items.map((item) => renderItemRow(item))}
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 pt-3.5 border-t border-slate-100 text-[13px] text-slate-500 leading-relaxed">
            휘발유·과일·달걀처럼 값이 자주 오르내리는 품목은 어느 달을 비교하느냐에 따라 차이가
            큽니다.
          </p>
        </section>

        {/* Mobile Copy CTA & Citation */}
        <div className="lg:hidden space-y-4">
          <CopyKakaoButton
            getCopyText={getCopyText}
            subInfo={
              selectedItems.length > 0
                ? `선택하신 ${selectedItems.length}개 품목이 복사 내용에 포함됩니다`
                : '품목을 고르지 않으면 상위 3개 품목이 자동으로 담깁니다'
            }
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            자료: 국가데이터처(옛 통계청) 「소비자물가조사」 품목별 소비자물가지수(2020=100) ·
            2016년 10월 대비 2026년 10월
          </p>
        </div>
      </div>
    </div>
  );
}
