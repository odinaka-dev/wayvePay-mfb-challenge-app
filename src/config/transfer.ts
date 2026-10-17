// Transfer rules in one place. Values mirror the mock API; change them together with the server.

/** NUBAN account numbers are exactly 10 digits. */
export const ACCOUNT_NUMBER_PATTERN = /^\d{10}$/;
export const ACCOUNT_NUMBER_LENGTH = 10;

/** Flat fee the mock API charges per outgoing transfer (₦25.00). */
export const TRANSFER_FEE_MINOR = 2500;

/** Per-transfer limits, in kobo: ₦100.00 to ₦5,000,000.00. */
export const MIN_TRANSFER_MINOR = 10_000;
export const MAX_TRANSFER_MINOR = 500_000_000;
