import type { transactionParams, transactionStatus, transactionType } from "@/types/api";

// ---------- Filters ----------

export const DATE_RANGES = ["all", "7d", "30d", "90d"] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export type TransactionFilters = {
  search: string;
  type: transactionType | "all";
  status: transactionStatus | "all";
  dateRange: DateRange;
};

export const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  status: "all",
  dateRange: "all",
};

/** Query parameters for GET /transactions, without the page. */
export type TransactionFilterParams = {
  search?: string;
  type?: transactionType;
  status?: transactionStatus;
  from?: string;
  to?: string;
};

export type TransactionQuery = TransactionFilterParams & { page: number; limit: number };

const DAY_MS = 86_400_000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Turns UI filters into API params. Every filter is applied together; "all" and empty
 * values are dropped. `now` is injectable so the date maths is testable.
 */
export function toFilterParams(
  filters: TransactionFilters,
  now = new Date(),
): TransactionFilterParams {
  const params: TransactionFilterParams = {};
  const search = filters.search.trim();
  if (search) params.search = search;
  if (filters.type !== "all") params.type = filters.type;
  if (filters.status !== "all") params.status = filters.status;
  if (filters.dateRange !== "all") {
    const days = Number.parseInt(filters.dateRange, 10);
    // Whole days, open-ended: from the start of the first day, with no `to`, so new
    // transactions still show up on refresh. Start-of-day keeps the query key stable.
    const from = startOfDay(now);
    from.setDate(from.getDate() - (days - 1));
    params.from = from.toISOString();
  }
  return params;
}

export function hasActiveFilters(filters: TransactionFilters) {
  return (
    filters.search.trim() !== "" ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.dateRange !== "all"
  );
}

// ---------- Pagination ----------

/**
 * Flattens fetched pages into one list, keeping the first copy of any transaction that
 * appears on more than one page (offset pagination shifts when new items arrive).
 */
export function mergeUniqueTransactions(pages: { items: transactionParams[] }[]) {
  const seen = new Set<string>();
  const items: transactionParams[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}

// ---------- Grouping ----------

export type transactionSection = {
  title: string;
  data: transactionParams[];
};

const dayFormat = new Intl.DateTimeFormat("en-NG", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "Today", "Yesterday", otherwise e.g. "Wed, 15 Oct 2026". */
export function formatDayLabel(date: Date, now = new Date()) {
  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return dayFormat.format(date);
}

/** Groups transactions into newest-first day sections for a SectionList. */
export function groupTransactionsByDay(
  items: transactionParams[],
  now = new Date(),
): transactionSection[] {
  const sorted = [...items].sort(
    // Stable tie-break on id so equal timestamps never reorder between renders.
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() ||
      a.id.localeCompare(b.id),
  );

  const sections: transactionSection[] = [];
  const byDay = new Map<number, transactionSection>();

  for (const item of sorted) {
    const date = new Date(item.createdAt);
    const key = startOfDay(date).getTime();
    let section = byDay.get(key);
    if (!section) {
      section = { title: formatDayLabel(date, now), data: [] };
      byDay.set(key, section);
      sections.push(section);
    }
    section.data.push(item);
  }

  return sections;
}
