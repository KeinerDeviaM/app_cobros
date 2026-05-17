export function formatMoney(value: number): string {
  const cleanValue = Number.isFinite(value) ? Math.round(value) : 0;
  return `$${cleanValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function parseMoney(value: string): number {
  const normalized = value.replace(/[^0-9]/g, '');
  return Number(normalized || 0);
}
