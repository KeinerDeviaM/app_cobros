export function parseMoney(value: string): number {
  const cleaned = String(value || '').replace(/\./g, '').replace(/,/g, '').trim();
  const numberValue = Number(cleaned);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function isPositiveMoney(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  const [year, month, day] = value.split('-').map(Number);

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

export function normalizeText(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return String(value || '').replace(/\s/g, '').replace(/\-/g, '').trim();
}