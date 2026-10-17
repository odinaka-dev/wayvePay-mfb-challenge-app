import { TRANSFER_FEE_MINOR } from "@/config/transfer";
import {
  calculateTotalDebit,
  calculateTransferFee,
  formatMinor,
  formatSignedMinor,
  minorToAmountInput,
  parseAmountToMinor,
} from "@/lib/money";

describe("parseAmountToMinor", () => {
  it.each([
    ["2500", 250000],
    ["2500.5", 250050],
    ["2500.50", 250050],
    ["0.29", 29],
    ["0.07", 7],
    ["1.005".slice(0, 4), 100],
    ["5.", 500],
    [" 12.30 ", 1230],
    ["0", 0],
  ])("parses %p to %p kobo", (input, expected) => {
    expect(parseAmountToMinor(input)).toBe(expected);
  });

  it.each(["", "abc", "1.234", ".5", "-5", "1,000", "1e3", "12.3.4", "NaN"])(
    "rejects %p",
    (input) => {
      expect(parseAmountToMinor(input)).toBeNull();
    },
  );

  it("avoids binary floating-point errors that Number(x) * 100 would introduce", () => {
    // 0.29 * 100 === 28.999999999999996 and 1.15 * 100 === 114.99999999999999 in IEEE 754.
    expect(0.29 * 100).not.toBe(29);
    expect(parseAmountToMinor("0.29")).toBe(29);
    expect(parseAmountToMinor("1.15")).toBe(115);
    expect(parseAmountToMinor("4.35")).toBe(435);
  });

  it("rejects amounts too large to represent exactly", () => {
    expect(parseAmountToMinor("999999999999999999")).toBeNull();
  });
});

describe("minorToAmountInput", () => {
  it.each([
    [250000, "2500"],
    [250050, "2500.5"],
    [250005, "2500.05"],
    [29, "0.29"],
  ])("formats %p as %p and round-trips", (minor, text) => {
    expect(minorToAmountInput(minor)).toBe(text);
    expect(parseAmountToMinor(text)).toBe(minor);
  });
});

describe("formatting", () => {
  it("always shows two decimal places in naira", () => {
    expect(formatMinor(25_000_000)).toBe("₦250,000.00");
    expect(formatMinor(250050)).toBe("₦2,500.50");
    expect(formatMinor(5)).toBe("₦0.05");
  });

  it("signs by transaction type, not by the number", () => {
    expect(formatSignedMinor(250050, "debit")).toBe("-₦2,500.50");
    expect(formatSignedMinor(250050, "credit")).toBe("+₦2,500.50");
  });
});

describe("fees and total debit (Scenario 6)", () => {
  it("adds the configured fee in integer kobo", () => {
    expect(calculateTransferFee(100_000)).toBe(TRANSFER_FEE_MINOR);
    expect(calculateTotalDebit(100_000)).toBe(100_000 + TRANSFER_FEE_MINOR);
  });

  it("totals a decimal amount exactly", () => {
    const amount = parseAmountToMinor("1000.10")!;
    expect(amount).toBe(100_010);
    expect(calculateTotalDebit(amount)).toBe(102_510);
    expect(formatMinor(calculateTotalDebit(amount))).toBe("₦1,025.10");
  });

  it("matches a naive float total only by luck; integers are always exact", () => {
    const amounts = ["0.10", "0.20", "0.30"].map((a) => parseAmountToMinor(a)!);
    expect(0.1 + 0.2 + 0.3).not.toBe(0.6);
    expect(amounts.reduce((sum, a) => sum + a, 0)).toBe(60);
  });
});
