import { AxiosError, AxiosHeaders } from "axios";

import {
  GENERIC_ERROR,
  MalformedResponseError,
  NETWORK_ERROR,
  getErrorMessage,
  isNetworkError,
  isNotFoundError,
} from "@/lib/errors";
import { classifyTransferError } from "@/lib/transfer-coordinator";

function httpError(status: number, data: unknown = {}) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, {}, {
    status,
    statusText: "",
    data,
    headers: {},
    config,
  });
}

const timeout = () => new AxiosError("timeout of 15000ms exceeded", AxiosError.ECONNABORTED, { headers: new AxiosHeaders() });

describe("getErrorMessage", () => {
  it("maps known API codes to our own copy", () => {
    expect(getErrorMessage(httpError(422, { code: "INSUFFICIENT_FUNDS", message: "balance < amount" }))).toBe(
      "You don't have enough balance for this transfer.",
    );
    expect(getErrorMessage(httpError(404, { code: "TRANSACTION_NOT_FOUND" }))).toBe(
      "We couldn't find this transaction.",
    );
  });

  it("never shows raw server messages for unknown codes", () => {
    const raw = "pg: relation users does not exist at /srv/app.js:42";
    const message = getErrorMessage(httpError(400, { code: "SOMETHING_NEW", message: raw }));
    expect(message).toBe(GENERIC_ERROR);
    expect(getErrorMessage(httpError(500, { message: raw }))).not.toContain("pg:");
  });

  it("explains network failures, timeouts, sessions and malformed responses", () => {
    expect(getErrorMessage(timeout())).toBe(NETWORK_ERROR);
    expect(isNetworkError(timeout())).toBe(true);
    expect(getErrorMessage(httpError(401))).toMatch(/session has expired/);
    expect(getErrorMessage(new MalformedResponseError())).toMatch(/unexpected response/);
    expect(getErrorMessage(new Error("internal"))).toBe(GENERIC_ERROR);
  });

  it("detects not-found", () => {
    expect(isNotFoundError(httpError(404))).toBe(true);
    expect(isNotFoundError(httpError(500))).toBe(false);
  });
});

describe("classifyTransferError", () => {
  it("treats definitive client errors as rejected", () => {
    expect(classifyTransferError(httpError(400))).toBe("rejected");
    expect(classifyTransferError(httpError(422, { code: "INSUFFICIENT_FUNDS" }))).toBe("rejected");
  });

  it("treats anything that may have reached the ledger as unknown", () => {
    expect(classifyTransferError(timeout())).toBe("unknown");
    expect(classifyTransferError(httpError(500))).toBe("unknown");
    expect(classifyTransferError(httpError(503))).toBe("unknown");
    expect(classifyTransferError(httpError(409))).toBe("unknown");
    expect(classifyTransferError(httpError(429))).toBe("unknown");
    expect(classifyTransferError(new MalformedResponseError())).toBe("unknown");
  });

  it("doesn't let an auth failure during verification settle the original transfer", () => {
    expect(classifyTransferError(httpError(401))).toBe("rejected");
    expect(classifyTransferError(httpError(401), { verifying: true })).toBe("unknown");
  });
});
