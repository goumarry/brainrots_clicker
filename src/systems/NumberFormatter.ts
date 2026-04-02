import { Decimal } from './BigNumber';

const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
  'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc',
  'Vg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg',
];

export function formatNumber(value: Decimal | number, decimals: number = 2): string {
  const d = value instanceof Decimal ? value : new Decimal(value);

  if (d.lt(1000)) {
    const n = d.toNumber();
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(decimals);
  }

  const exp = Math.floor(d.log10());
  const suffixIndex = Math.floor(exp / 3);

  if (suffixIndex < SUFFIXES.length) {
    const divisor = new Decimal(10).pow(suffixIndex * 3);
    const display = d.div(divisor).toNumber();
    return display.toFixed(decimals) + SUFFIXES[suffixIndex];
  }

  // Scientific notation fallback
  return d.toExponential(decimals);
}

export function formatGold(value: Decimal | number): string {
  return formatNumber(value, 1);
}

export function formatDPS(value: Decimal | number): string {
  return formatNumber(value, 1);
}

export function formatHP(value: Decimal | number, max: Decimal | number): string {
  const v = value instanceof Decimal ? value : new Decimal(value);
  const m = max instanceof Decimal ? max : new Decimal(max);
  return `${formatNumber(v, 0)} / ${formatNumber(m, 0)}`;
}
