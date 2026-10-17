import type { transferStatusParams } from "@/types/api";
import { palette } from "@/constants/colors";
import { maskAccountNumber } from "@/lib/format";
import { formatMinor } from "@/lib/money";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function receiptRows(transfer: transferStatusParams, bankName?: string) {
  return [
    ["Status", transfer.status[0].toUpperCase() + transfer.status.slice(1)],
    ["Amount", formatMinor(transfer.amountMinor)],
    ["Transaction Fee", formatMinor(transfer.feeMinor)],
    ["Total Debit", formatMinor(transfer.totalDebitMinor)],
    ["Receiver", transfer.recipientName],
    ["Account", [bankName, maskAccountNumber(transfer.recipientAccountNumber)].filter(Boolean).join(" ")],
    ["Narration", transfer.narration],
    ["Transaction ID", transfer.reference],
    ["Date", new Date(transfer.createdAt).toLocaleString("en-NG")],
  ].filter(([, value]) => value);
}

/** Plain-text receipt for the share sheet. */
export function buildReceiptText(transfer: transferStatusParams, bankName?: string) {
  const lines = receiptRows(transfer, bankName).map(([label, value]) => `${label}: ${value}`);
  return ["Wayve transfer receipt", "", ...lines].join("\n");
}

/** Printable HTML receipt, rendered to PDF by expo-print. */
export function buildReceiptHtml(transfer: transferStatusParams, bankName?: string) {
  const rows = receiptRows(transfer, bankName)
    .map(
      ([label, value]) =>
        `<tr><td class="label">${escapeHtml(label)}</td><td class="value">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: ${palette.text}; padding: 32px; }
      .card { max-width: 480px; margin: 0 auto; background: ${palette.background}; border-radius: 24px; padding: 32px; }
      h1 { font-size: 20px; text-align: center; margin: 0 0 4px; }
      .amount { font-size: 28px; font-weight: 700; text-align: center; color: ${palette.primary}; margin: 8px 0 24px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 8px 0; font-size: 14px; border-top: 1px dashed ${palette.border}; }
      .label { color: ${palette.muted}; }
      .value { text-align: right; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Wayve Transfer Receipt</h1>
      <div class="amount">${escapeHtml(formatMinor(transfer.amountMinor))}</div>
      <table>${rows}</table>
    </div>
  </body>
</html>`;
}
