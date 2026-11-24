export type BasketCategory = '외식' | '장보기' | '생활';

export interface BasketItem {
  id: string;
  name: string;
  category: BasketCategory;
  /** 10-year price ratio from Oct 2016 to Oct 2026 (e.g., 1.7755 = +77.55%) */
  ratio10y: number;
  /** Displayed 10-year change percent */
  change10yPct: number;
  /** Displayed compound annual growth rate percent */
  cagrPct: number;
}

export const OVERALL_CPI = {
  baseYearLabel: '2016년 10월',
  targetYearLabel: '2026년 10월',
  ratio10y: 1.2527,
  change10yPct: 25.3,
  cagrDisplayPct: 2.3,
  exactAnnualRatePct: 2.28,
} as const;

export const BASKET_ITEMS: BasketItem[] = [
  { id: 'kimbap', name: '김밥', category: '외식', ratio10y: 1.7755, change10yPct: 77.5, cagrPct: 5.9 },
  { id: 'egg', name: '달걀', category: '장보기', ratio10y: 1.6554, change10yPct: 65.5, cagrPct: 5.2 },
  { id: 'rice', name: '쌀', category: '장보기', ratio10y: 1.6158, change10yPct: 61.6, cagrPct: 4.9 },
  { id: 'apple', name: '사과', category: '장보기', ratio10y: 1.5718, change10yPct: 57.2, cagrPct: 4.6 },
  { id: 'jajangmyeon', name: '자장면', category: '외식', ratio10y: 1.5674, change10yPct: 56.7, cagrPct: 4.6 },
  { id: 'chicken', name: '치킨', category: '외식', ratio10y: 1.4636, change10yPct: 46.4, cagrPct: 3.9 },
  { id: 'pork', name: '돼지고기', category: '장보기', ratio10y: 1.4416, change10yPct: 44.2, cagrPct: 3.7 },
  { id: 'samgyeopsal', name: '삼겹살(외식)', category: '외식', ratio10y: 1.3773, change10yPct: 37.7, cagrPct: 3.3 },
  { id: 'ramen', name: '라면', category: '장보기', ratio10y: 1.3594, change10yPct: 35.9, cagrPct: 3.1 },
  { id: 'milk', name: '우유', category: '장보기', ratio10y: 1.3251, change10yPct: 32.5, cagrPct: 2.9 },
  { id: 'beef', name: '국산쇠고기', category: '장보기', ratio10y: 1.3107, change10yPct: 31.1, cagrPct: 2.7 },
  { id: 'gasoline', name: '휘발유', category: '생활', ratio10y: 1.2992, change10yPct: 29.9, cagrPct: 2.7 },
  { id: 'bus', name: '시내버스료', category: '생활', ratio10y: 1.2384, change10yPct: 23.8, cagrPct: 2.2 },
  { id: 'electricity', name: '전기료', category: '생활', ratio10y: 1.2228, change10yPct: 22.3, cagrPct: 2.0 },
  { id: 'coffee', name: '커피(외식)', category: '외식', ratio10y: 1.1622, change10yPct: 16.2, cagrPct: 1.5 },
];

export const CATEGORY_ORDER: BasketCategory[] = ['외식', '장보기', '생활'];

export const BASKET_BASE_PRESETS = [
  { label: '1만 원', value: 10000 },
  { label: '5만 원', value: 50000 },
  { label: '10만 원', value: 100000 },
  { label: '50만 원', value: 500000 },
  { label: '100만 원', value: 1000000 },
];
