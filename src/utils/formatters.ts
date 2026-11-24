/**
 * Format Korean Won currency with commas (e.g., 12,527원)
 */
export function formatWon(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString('ko-KR')}원`;
}

/**
 * Format large Korean amounts into readable 억/만 원 units (e.g., 1억 2,527만 원)
 */
export function formatKoreanUnits(amount: number): string {
  const abs = Math.round(Math.abs(amount));
  const sign = amount < 0 ? '-' : '';

  if (abs === 0) return '0원';
  if (abs < 10000) return `${sign}${abs.toLocaleString('ko-KR')}원`;

  const eok = Math.floor(abs / 100000000);
  const man = Math.floor((abs % 100000000) / 10000);
  const rest = abs % 10000;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man > 0) parts.push(`${man.toLocaleString('ko-KR')}만`);

  if (eok === 0 && man > 0 && rest > 0) {
    return `${sign}${abs.toLocaleString('ko-KR')}원`;
  }

  if (rest > 0 && eok > 0 && man === 0) {
    parts.push(`${rest.toLocaleString('ko-KR')}`);
    return `${sign}${parts.join(' ')}원`;
  }

  return `${sign}${parts.join(' ')} 원`;
}

/**
 * Compact Korean unit label without spaces before 원 for tight headers (e.g., 1억 2,500만 원 or 1만 원)
 */
export function formatManEok(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return '0원';
  const eok = Math.floor(rounded / 100000000);
  const man = Math.floor((rounded % 100000000) / 10000);
  const rest = rounded % 10000;

  if (eok > 0 && rest === 0) {
    return man > 0 ? `${eok.toLocaleString('ko-KR')}억 ${man.toLocaleString('ko-KR')}만 원` : `${eok.toLocaleString('ko-KR')}억 원`;
  }
  if (eok === 0 && man > 0 && rest === 0) {
    return `${man.toLocaleString('ko-KR')}만 원`;
  }
  return `${rounded.toLocaleString('ko-KR')}원`;
}

/**
 * Compute annualized IRR (Internal Rate of Return) for regular monthly deposits
 * held over `totalMonths` (where payments occur at the start of months 0..payMonths-1)
 * and redeemed at `totalMonths` for `refundAmount`.
 * Uses binary search + Newton-Raphson for robust convergence.
 */
export function calculateMonthlyPlanAnnualIRR(
  monthlyPayment: number,
  payMonths: number,
  totalMonths: number,
  refundAmount: number
): number {
  if (monthlyPayment <= 0 || payMonths <= 0 || totalMonths <= 0 || refundAmount <= 0) {
    return 0;
  }

  const totalPaid = monthlyPayment * payMonths;
  if (Math.abs(refundAmount - totalPaid) < 1) {
    return 0;
  }

  // f(r_m) = sum_{k=0}^{payMonths-1} monthlyPayment * (1 + r_m)^(totalMonths - k) - refundAmount
  const evalNPV = (rm: number) => {
    let fv = 0;
    for (let k = 0; k < payMonths; k++) {
      fv += monthlyPayment * Math.pow(1 + rm, totalMonths - k);
    }
    return fv - refundAmount;
  };

  let low = -0.05; // -5% monthly
  let high = 0.1;  // +10% monthly

  // Expand bounds if extreme
  while (evalNPV(low) > 0 && low > -0.5) low -= 0.05;
  while (evalNPV(high) < 0 && high < 1.0) high += 0.1;

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    const val = evalNPV(mid);
    if (Math.abs(val) < 1e-4) {
      low = mid;
      high = mid;
      break;
    }
    if (val > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const monthlyRate = (low + high) / 2;
  // Convert monthly effective rate to annual effective rate (%)
  const annualRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;
  return annualRate;
}
