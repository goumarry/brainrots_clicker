import Decimal from 'break_infinity.js';

export { Decimal };

export function toBigNum(value: number | string | Decimal): Decimal {
  return new Decimal(value);
}

export function bigNumZero(): Decimal {
  return new Decimal(0);
}

export function bigNumOne(): Decimal {
  return new Decimal(1);
}

export function bigNumMax(a: Decimal, b: Decimal): Decimal {
  return a.gte(b) ? a : b;
}

export function bigNumMin(a: Decimal, b: Decimal): Decimal {
  return a.lte(b) ? a : b;
}
