export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function todayISO() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

export function currentMonthKey() {
  return todayISO().slice(0, 7);
}

export function monthKey(date) {
  return String(date || '').slice(0, 7);
}

export function formatMoney(value, currency = '$') {
  const number = Number(value) || 0;
  const sign = number < 0 ? '-' : '';
  return `${sign}${currency}${Math.abs(number).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatMonth(key) {
  const [year, month] = String(key || '').split('-').map(Number);
  if (!year || !month) return key || '';
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });
}

export function signedMoney(value, currency) {
  const number = Number(value) || 0;
  return `${number >= 0 ? '+' : '-'} ${formatMoney(Math.abs(number), currency)}`;
}
