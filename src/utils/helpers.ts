/** Boundary ngày theo local time rồi toISOString — cùng pattern với web admin
 *  (cột timestamptz, lọc theo ngày địa phương). */
export function getDayRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 là bắt đầu
  
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start: start.toISOString(), end: end.toISOString() };
}

export function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Chuẩn hóa biển số ô tô khi gõ: "75a12345" → "75A-123.45".
 *  Cấu trúc: 2 số tỉnh + 1-2 chữ seri + 4-5 số; ký tự thừa/sai vị trí bị bỏ qua. */
export function formatPlateNumber(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  let province = '';
  let series = '';
  let number = '';
  for (const ch of cleaned) {
    const isDigit = ch >= '0' && ch <= '9';
    if (province.length < 2) {
      if (isDigit) province += ch;
    } else if (!isDigit) {
      if (series.length < 2 && number.length === 0) series += ch;
    } else if (series.length > 0 && number.length < 5) {
      number += ch;
    }
  }
  let out = province + series;
  if (number) {
    out += '-' + (number.length === 5 ? `${number.slice(0, 3)}.${number.slice(3)}` : number);
  }
  return out;
}

export function isValidPlateNumber(plate: string): boolean {
  return /^\d{2}[A-Z]{1,2}-(\d{3}\.\d{2}|\d{4})$/.test(plate);
}
