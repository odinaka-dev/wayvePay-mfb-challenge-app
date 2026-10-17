import { TRANSFER_FEE_MINOR } from "@/config/transfer";

// All money is held as integer minor units (kobo). Arithmetic only ever happens on integers;
// the one division by 100 below is for display, never for a value we compute with.

const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 250050 -> "₦2,500.50" */
export function formatMinor(amountMinor: number) {
  return ngn.format(amountMinor / 100);
}

/** Debits get "-", credits "+": 250050 debit -> "-₦2,500.50" */
export function formatSignedMinor(amountMinor: number, type: "debit" | "credit") {
  return `${type === "debit" ? "-" : "+"}${formatMinor(Math.abs(amountMinor))}`;
}

const AMOUNT_INPUT = /^(\d+)(?:\.(\d{0,2}))?$/;

/**
 * Parses naira typed by the user into kobo without floating-point maths:
 * "2500.5" -> 250050, "0.29" -> 29. Returns null for anything that isn't a plain
 * amount with at most 2 decimal places, or that is too large to represent exactly.
 */
export function parseAmountToMinor(input: string): number | null {
  const match = AMOUNT_INPUT.exec(input.trim());
  if (!match) return null;
  const [, naira, kobo = ""] = match;
  const minor = Number(naira) * 100 + Number(kobo.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Kobo back to an editable input string: 250050 -> "2500.5", 250000 -> "2500". */
export function minorToAmountInput(amountMinor: number) {
  const naira = Math.trunc(amountMinor / 100);
  const kobo = amountMinor % 100;
  if (kobo === 0) return String(naira);
  return `${naira}.${String(kobo).padStart(2, "0").replace(/0$/, "")}`;
}

export function calculateTransferFee(_amountMinor: number) {
  return TRANSFER_FEE_MINOR;
}

export function calculateTotalDebit(amountMinor: number) {
  return amountMinor + calculateTransferFee(amountMinor);
}
