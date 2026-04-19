export function toDateOnly(dateStr) {
  try {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  const targetDateOnly = toDateOnly(dateStr);
  if (!targetDateOnly) return false;
  return targetDateOnly === toDateOnly(new Date().toISOString());
}

export function daysDiff(dateStr) {
  if (!dateStr) return 0;
  try {
    const sale = new Date(dateStr);
    const today = new Date();
    if (isNaN(sale.getTime())) return 0;
    sale.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return Math.floor((today - sale) / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
}
