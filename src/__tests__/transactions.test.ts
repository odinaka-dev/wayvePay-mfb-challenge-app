import {
  DEFAULT_FILTERS,
  groupTransactionsByDay,
  hasActiveFilters,
  mergeUniqueTransactions,
  toFilterParams,
} from "@/lib/transactions";
import { makeTransaction } from "@/test/fixtures";

const NOW = new Date(2026, 9, 17, 15, 0); // 17 Oct 2026, 15:00 local

describe("toFilterParams", () => {
  it("sends nothing for the default filters", () => {
    expect(toFilterParams(DEFAULT_FILTERS, NOW)).toEqual({});
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it("combines every filter instead of letting one overwrite another", () => {
    const params = toFilterParams(
      { search: "  merchant ", type: "debit", status: "reversed", dateRange: "7d" },
      NOW,
    );
    expect(params).toEqual({
      search: "merchant",
      type: "debit",
      status: "reversed",
      from: new Date(2026, 9, 11).toISOString(),
    });
  });

  it("uses a whole-day, open-ended date range so the query key is stable", () => {
    const a = toFilterParams({ ...DEFAULT_FILTERS, dateRange: "30d" }, NOW);
    const b = toFilterParams({ ...DEFAULT_FILTERS, dateRange: "30d" }, new Date(2026, 9, 17, 23, 59));
    expect(a).toEqual(b);
    expect(a.to).toBeUndefined();
  });

  it("ignores whitespace-only search", () => {
    expect(toFilterParams({ ...DEFAULT_FILTERS, search: "   " }, NOW)).toEqual({});
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, search: "   " })).toBe(false);
  });
});

describe("mergeUniqueTransactions (Scenario 2)", () => {
  it("keeps one copy of a transaction that appears on two pages, in order", () => {
    const a = makeTransaction({ id: "a" });
    const b = makeTransaction({ id: "b" });
    const c = makeTransaction({ id: "c" });
    const d = makeTransaction({ id: "d" });

    const merged = mergeUniqueTransactions([{ items: [a, b, c] }, { items: [c, d] }]);

    expect(merged.map((t) => t.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("keeps the first copy when duplicates differ", () => {
    const first = makeTransaction({ id: "x", status: "pending" });
    const later = { ...first, status: "successful" as const };
    expect(mergeUniqueTransactions([{ items: [first] }, { items: [later] }])[0].status).toBe("pending");
  });
});

describe("groupTransactionsByDay", () => {
  it("groups newest first with Today / Yesterday labels and a stable order", () => {
    const today1 = makeTransaction({ id: "t1", createdAt: new Date(2026, 9, 17, 9).toISOString() });
    const today2 = makeTransaction({ id: "t2", createdAt: new Date(2026, 9, 17, 9).toISOString() });
    const yesterday = makeTransaction({ id: "y", createdAt: new Date(2026, 9, 16, 20).toISOString() });
    const older = makeTransaction({ id: "o", createdAt: new Date(2026, 9, 1, 8).toISOString() });

    const sections = groupTransactionsByDay([older, today2, yesterday, today1], NOW);

    expect(sections.map((s) => s.title)).toEqual(["Today", "Yesterday", expect.stringContaining("1 Oct 2026")]);
    expect(sections[0].data.map((t) => t.id)).toEqual(["t1", "t2"]);
  });
});
