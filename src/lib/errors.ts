import { isAxiosError } from "axios";

// Customer-facing copy for the error codes the API returns as `{ message, code }`.
// Server `message` text is never shown directly: unknown codes fall back to a message
// chosen by HTTP status, so internal details can't leak into the UI.
const MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_BANK: "Select a valid bank.",
  INVALID_ACCOUNT_NUMBER: "Enter a valid 10-digit account number.",
  ACCOUNT_NOT_FOUND: "We couldn't find an account with these details.",
  INSUFFICIENT_FUNDS: "You don't have enough balance for this transfer.",
  INSUFFICIENT_BALANCE: "You don't have enough balance for this transfer.",
  TRANSACTION_NOT_FOUND: "We couldn't find this transaction.",
  TRANSFER_NOT_FOUND: "We couldn't find this transfer.",
};

export const GENERIC_ERROR = "Something went wrong. Please try again.";
export const NETWORK_ERROR = "Network error. Check your connection and try again.";

/** The server answered, but the body didn't match the API contract. */
export class MalformedResponseError extends Error {
  constructor() {
    super("Response did not match the API contract");
    this.name = "MalformedResponseError";
  }
}

/** True when the request never got a response (offline, timeout, DNS), so the outcome is unknown. */
export function isNetworkError(error: unknown) {
  return isAxiosError(error) && !error.response;
}

export function getErrorStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function getErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const code = error.response?.data?.code;
  return typeof code === "string" ? code : undefined;
}

export function isNotFoundError(error: unknown) {
  return getErrorStatus(error) === 404;
}

/** Turns an API or network error into a message that is safe to show the user. */
export function getErrorMessage(error: unknown, fallback = GENERIC_ERROR) {
  if (isNetworkError(error)) return NETWORK_ERROR;
  if (error instanceof MalformedResponseError) {
    return "We received an unexpected response. Please try again.";
  }

  const code = getErrorCode(error);
  if (code && MESSAGES_BY_CODE[code]) return MESSAGES_BY_CODE[code];

  const status = getErrorStatus(error);
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  if (status !== undefined && status >= 500) {
    return "Our service is having trouble right now. Please try again shortly.";
  }
  return fallback;
}
