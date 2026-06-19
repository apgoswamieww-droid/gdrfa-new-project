/**
 * Parses a date value safely, avoiding cross-browser timezone shifts.
 * Handles "yyyy-MM-dd HH:mm:ss" format from SQL Server by treating
 * the date parts as local time components.
 */
function parseDateSafely(date: string | number | Date): Date | null {
  if (typeof date === "string") {
    const cleaned = date.trim();
    // Match "yyyy-MM-dd HH:mm:ss" or "yyyy-MM-ddTHH:mm:ss"
    const m = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      const [, y, mo, d, h, mi, s] = m.map(Number);
      return new Date(y, mo - 1, d, h, mi, s);
    }
    // Match "dd/MM/yyyy HH:mm" already formatted
    const m2 = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (m2) {
      const [, d, mo, y, h, mi] = m2.map(Number);
      return new Date(y, mo - 1, d, h, mi);
    }
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

export const formatDate = (date: string | number | Date | null | undefined, includeTime: boolean = true): string => {
  if (!date) return "-";

  const d = parseDateSafely(date);
  if (!d) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  return `${day}/${month}/${year}`;
};
