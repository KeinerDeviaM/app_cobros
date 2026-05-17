export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function displayDate(value: string): string {
  if (!value) return '';
  const parts = value.slice(0, 10).split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
