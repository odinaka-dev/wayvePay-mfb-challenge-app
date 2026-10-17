// Shared date and identifier formatting, so every screen shows the same format.

const timeFormat = new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false });
const dateFormat = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });

/** "15:20" */
export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso));
}

/** "14 Mar 2026" */
export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

/** "14 Mar 2026, 15:20" */
export function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/** "1234567890" -> "******7890". Also safe on numbers the API already masked. */
export function maskAccountNumber(accountNumber: string) {
  return `******${accountNumber.slice(-4)}`;
}
