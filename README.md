# Wayve Mobile Challenge

A React Native (Expo) banking module for the Wayve Microfinance Bank mobile engineering assessment. It covers the account overview, transaction history, transaction details and a simulated bank transfer. The emphasis is on correct behaviour under failure: unknown transfer outcomes, duplicate submissions, stale responses, and money arithmetic.

> All transfers go to a **mock API**. No real banking infrastructure or customer data is involved.

## Contents

1. [Quick start](#quick-start)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Technical note](#technical-note)
5. [API contract and mock server](#api-contract-and-mock-server)
6. [Testing](#testing)
7. [Known limitations](#known-limitations)
8. [Before production](#before-production)
9. [Screenshots](#screenshots)
10. [AI tool usage](#ai-tool-usage)

---

## Quick start

**Requirements:** Node 20+, npm 10+. To run on a device, use Expo Go or an iOS Simulator / Android Emulator.

```bash
npm install
cp .env.example .env.local   # points the app at the mock API
npx expo start               # press i / a, or scan the QR code with Expo Go
```

| Command | What it does |
| --- | --- |
| `npm test` | Run the full test suite (Jest, no network) |
| `npm run test:coverage` | Tests with a coverage report |
| `npm run typecheck` | `tsc --noEmit` (strict mode) |
| `npm run lint` | ESLint via `expo lint` |

**Configuration.** The only setting is `EXPO_PUBLIC_URI`, the mock API's base URL (without `/api/v1`). `.env.local` is git-ignored; `.env.example` is committed. No secrets are needed.

> **Cold start:** the hosted mock API runs on a free Render instance that sleeps when idle. The first request after a while can take 30 to 60 seconds, longer than the client's 15-second timeout. If the first load fails, pull to refresh after a few seconds.

---

## Features

### A. Account overview (`src/app/(tabs)/home.tsx`)

- **Greeting:** shows the customer's first name, with a greeting that depends on the time of day.
- **Account number:** shown with a copy action, which is announced to screen readers.
- **Hide / reveal balance:** the choice is saved in secure storage, so a hidden balance stays hidden across restarts until the user reveals it. While the saved value loads, the balance stays masked, so it never flashes on screen.
- **Recent transactions:** the latest five, each opening its details screen.
- **Quick actions:** *Send money* and *History*.
- **States:**
  - **Loading:** skeleton placeholders.
  - **Empty:** an explanatory message.
  - **Error:** a retry button.
  - **Refresh failed:** a banner over the data that is still shown.
- **Pull-to-refresh:** refetches the account and transactions together, joining any request already in flight (`cancelRefetch: false`) instead of starting a duplicate.
- **Double-tap protection:** navigation actions ignore repeat taps for 600 ms (`useGuardedNavigation`), so a double tap can't push two screens.

### B. Transaction history (`src/app/(tabs)/transactions.tsx`)

- **Search:** by description or reference, debounced by 350 ms.
- **Filters:**
  - by type (money in / money out);
  - by status (successful, pending, failed, reversed);
  - by date range (last 7, 30 or 90 days).
- **Combined filters:** filters work together. Each control sends a *patch* that is merged into the filter state, so changing one never resets another.
- **Infinite scroll:** 20 per page. A transaction that appears on more than one page is shown once.
- **Grouping:** by day (*Today*, *Yesterday*, then a date).
- **Distinct statuses:** all four statuses look different. Failed and reversed amounts are struck through, and reversed has its own colour and icon.
- **Empty vs failed:** distinct messages for "no transactions", "no matches for your filters" (with *Clear filters*) and "couldn't load".
- **Refresh and paging failures:** if a refresh fails, the loaded list stays with a banner; if loading more fails, there's a retry footer.
- **Large histories:** the list renders in small batches and drops off-screen rows.

### C. Transaction details (`src/app/transaction/[id].tsx`)

- **Fields shown:**
  - amount and currency, type, and status;
  - reference, with a copy action;
  - date and time, and description;
  - recipient or sender;
  - the fee (only where the API supplies one) and the total.
- **Every status handled:**
  - *Pending* explicitly says it isn't final, and the screen **polls every 5 s** until it is.
  - *Failed* says no money left the account.
  - *Reversed* explains the money was returned, with a different colour, icon and wording from failed.
- **Status changes:** if the status changes while the screen is open (Scenario 4), a banner and a screen-reader announcement report the new status.
- **Failure handling:**
  - a missing transaction (404) shows "Transaction not found", with no retry;
  - a network failure shows a retry;
  - a malformed response is rejected at the service boundary (see [Architecture](#architecture)).

### D. Simulated bank transfer (`src/app/transfer/*`)

`index` (bank, account number, account-name enquiry, amount, note) → `confirm` (review) → `pin` (confirm) → `receipt` (result and receipt), or `verify` when the outcome is unknown.

- **Validation** (`src/lib/schema.ts`, rules in `src/config/transfer.ts`):
  - account number: exactly 10 digits;
  - amount: positive, at most 2 decimal places, between **₦100.00** and **₦5,000,000.00**;
  - note: at most 100 characters.
- **Clear errors:** the amount reports only the first problem, so the user sees one clear message.
- **Account-name enquiry:** runs once a bank and a valid account number are entered.
- **Balance check:** the client checks **amount + fee** against the available balance.
- **Review:** shows the recipient, bank, account, amount, **fee, and total debit**. *Change* goes back with the form still filled in.
- **Back button:** the Android back button and the back gesture are blocked while the transfer is being sent.
- **Receipt:** keeps checking a pending transfer's status, and can download a PDF or share as text.
- **Reliability:** described in the [technical note](#technical-note).

### E. Resilience

- **Offline:** detected by NetInfo and wired into React Query's `onlineManager`, so queries pause while offline and refetch on reconnect. An app-wide banner shows while offline, and sending a transfer is blocked before anything is sent.
- **Expired session:** the first 401 triggers one sign-out. Cached data is cleared, in-flight requests are cancelled, and the app shows a *Session expired* screen. 4xx responses are never retried, so there is no retry loop.
- **Returning to the app:** coming back to the foreground refetches stale data. An unresolved transfer is restored and checked when the app starts.
- **Consistent errors:** every error goes through one mapper, `getErrorMessage`. Raw server messages, stack traces and internal details are never shown.

### F. UI and accessibility

- **Brand:** blue and white, with shared tokens (`tailwind.config.js` and `src/constants/colors.ts`) and a Tailwind spacing scale.
- **Shared components:** Button, Input, Card, Banner, StatusBadge, Chip, Skeleton and others in `src/components/shared`.
- **Screen readers:** labels and roles on important actions; errors and status changes are announced; touch targets are at least 44 pt.
- **Keyboard:** the transfer form adjusts for the keyboard.

---

## Architecture

```
src/
  app/                 Screens and navigation only (Expo Router, file-based)
    (tabs)/            home, transactions, settings (+ placeholder scan, messages)
    transaction/[id]   transaction details (modal)
    transfer/          index → confirm → pin → receipt | verify
  components/          Presentation only: shared/, transactions/, transfer/
  hooks/               Data hooks (React Query) and small UI hooks
  providers/           App-wide state: query client, pending transfer, session, transfer draft
  services/            HTTP: axios client + one function per endpoint, response validation
  lib/                 Domain logic, framework-free and unit-tested:
    money.ts             parsing, formatting, fee, total debit (integer kobo)
    schema.ts            transfer form validation
    transactions.ts      filters → API params, page merge/dedupe, day grouping
    transfer-coordinator.ts   exactly-once transfer lifecycle (see technical note)
    errors.ts            error classification and customer-facing messages
    session.ts, storage.ts, format.ts
  config/transfer.ts   Account-number format, fee, transfer limits
  types/api.ts         API contract as zod schemas (types are inferred from them)
  test/                Test fixtures, in-memory mock bank, render helpers
  __tests__/           Unit and integration tests
```

**Layering:** screens → hooks/providers → services → `lib`. Business rules live in `lib/` as plain TypeScript with no React or network code, so they can be tested directly and stay out of the components. Screens only orchestrate. Components only render.

### Why these libraries

| Library | Why |
| --- | --- |
| **Expo + Expo Router** | Builds without native tooling, typed file-based routes, React Navigation underneath (stacks, tabs, modals, Android back handling). |
| **TanStack Query** | Server state, with caching keyed by query, request de-duplication, cancellation through `AbortSignal`, retry rules, refetch on focus and reconnect, and keeping old data when a refetch fails. These map directly onto the brief's reliability requirements. No global client store is needed. |
| **zod** | One definition for the API contract (runtime validation plus inferred types) and for form validation. |
| **react-hook-form** | Form state with the zod resolver and few re-renders. |
| **expo-secure-store** | Keychain / Keystore storage for the pending-transfer record (account number and amount) and the balance-privacy setting. |
| **NativeWind** | Shared design tokens via Tailwind classes. |

Server data lives in React Query. The client state that matters (the in-flight transfer) lives in a small framework-free coordinator, exposed to React with `useSyncExternalStore`. The transfer draft between form steps is a scoped React context.

---

## Technical note

### How uncertain transfer outcomes are handled

`src/lib/transfer-coordinator.ts` owns the transfer lifecycle:

1. **Write-ahead.** Before the POST, the request and its idempotency key are saved to secure storage. If that save fails, nothing is sent.
2. **Error classification.**

   | Response | Outcome | What the app does |
   | --- | --- | --- |
   | 2xx | accepted | Show the receipt; track it while `pending`; forget it once final. |
   | 400 / 422 (e.g. `INSUFFICIENT_FUNDS`) | rejected: not created | Clear the record and show the mapped error; the user can edit. |
   | timeout, network error, 5xx, 408/409/425/429, unreadable body | **unknown** | Keep the record and go to the **Verify** screen. |

3. **Verification never creates a new transfer.** It re-sends the *stored* request with the *same* idempotency key. The server treats a repeated key as a lookup and returns the original transfer. Once a transaction id is known, verification uses `GET /transfers/:id/status` instead. A 401 during verification counts as unknown, not as a rejection.
4. **Retries:** the Verify screen re-checks automatically after 2, 4 and 8 seconds, then offers *Check again*. It never offers "send again".
5. **App restart (Scenario 7):** the record survives restarts. On launch the app restores it and verifies it once. Home and the transfer form show a "confirming your transfer" banner, and a *new* transfer is blocked until the old one is resolved.
6. **Final status:** comes from the server only, by polling the status endpoint (every 3 s on the receipt, and on demand from Verify). The client never assumes success.

### How duplicate submissions are prevented

There are four separate guards:

- **Idempotency key:** one per transfer intent (`expo-crypto` UUID), sent as the `Idempotency-Key` header. It stays the same across double taps, timeouts, back-and-forth navigation and app restarts. It changes only when the transfer details change, or after a definitive rejection.
- **Single-flight lock:** the coordinator shares one in-flight promise, so concurrent `submit` / `verify` calls join it instead of sending another request. Disabling the button is only a UX extra on top of this.
- **One unresolved transfer at a time:** a different transfer is `blocked` until the current one is resolved.
- **Write-ahead record:** a crash between "tap" and "response" can't lose track of the transfer.

### How stale API responses are prevented

- **Each filter set has its own cache entry.** The history query key includes every filter (`["transaction-history", params, limit]`). A late response for an older search can only land in that search's entry, never in the list on screen (Scenario 1).
- **Cancellation:** every `queryFn` passes React Query's `AbortSignal` to axios, so superseded requests are cancelled. Search is debounced.
- **Date presets** send only `from`, at the start of a day, so the query key doesn't change on every render. The range has no end, so a refresh still picks up new transactions.
- **Pagination restarts on filter change.** Pages are merged by transaction id, keeping the first copy (Scenario 2), and sorted with a stable tie-break.
- **Failed refetches** keep the last good data and show a banner (Scenario 5). The list is only replaced by an error state when there is no data at all.
- **The details screen** polls while pending and reports status changes (Scenario 4). The receipt and coordinator stop tracking once a status is final.

### How money is represented safely

- **Integer kobo everywhere:** all amounts are stored as integer **kobo** (`*Minor` fields). zod rejects non-integer amounts from the API.
- **String parsing:** user input is parsed by `parseAmountToMinor`, which splits naira and kobo as strings. It never uses `Number(x) * 100` (for example, `0.29 * 100 === 28.999…`). It rejects more than 2 decimal places and anything beyond `Number.MAX_SAFE_INTEGER`.
- **Integer arithmetic:** fee and total debit are integer additions. Dividing by 100 happens only when formatting for display.
- **Consistent display:** one `Intl.NumberFormat("en-NG", NGN)` formatter, always with 2 decimal places. Credit/debit signs come from the transaction type, not from the sign of the number.
- **Fee source:** the fee (₦25.00 flat) is in `src/config/transfer.ts`, matching the mock API's `feeMinor`. The receipt shows the server's figures.

### What should change before production

See [Before production](#before-production).

---

## API contract and mock server

Base path `/api/v1`. All `*Minor` amounts are integers in kobo. Errors are `{ "message": string, "code": string }`. The client maps `code` to its own copy and never displays `message`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/account` | Account summary |
| GET | `/transactions?page&limit&search&type&status&from&to` | `type`: `debit` / `credit`. `status`: `successful` / `pending` / `failed` / `reversed`. `from` / `to`: ISO-8601 |
| GET | `/transactions/:id` | Adds optional `recipient { name, bankName?, accountNumber? }`, `sender { name }`, `feeMinor` |
| POST | `/transfers/resolve-account` | `{ bankCode, accountNumber }` → `{ accountName, bankCode, bankName, accountNumber }` |
| POST | `/transfers` | Body as specified; **idempotency key sent as the `Idempotency-Key` header** |

**Extensions to the given contract:**

| Method | Path | Purpose |
| --- | --- | --- |
| — | `Idempotency-Key` header | Carries the idempotency key. Repeating a key returns the original transfer instead of creating a new one. |
| GET | `/banks` | `{ items: [{ bankCode, bankName }] }` for bank selection |
| GET | `/transfers/:id/status` | Transfer status; returns the full transfer record, including `feeMinor`, `totalDebitMinor`, `narration`, `createdAt`, `updatedAt` |
| POST | `/mock/transfers/:id/status` | `{ status: "successful" \| "failed" }`, to settle a pending mock transfer. Exposed in **dev builds only** (buttons on the receipt) |
| — | `POST /transfers` response | Returns the same full record as the status endpoint |

**Error codes seen and handled:**
- `INVALID_BANK`
- `INVALID_ACCOUNT_NUMBER`
- `INSUFFICIENT_FUNDS` / `INSUFFICIENT_BALANCE`
- `TRANSACTION_NOT_FOUND`
- `TRANSFER_NOT_FOUND`

**Hosted mock API:** `https://backend-bank-api.onrender.com`. Any 10-digit account resolves to "Demo Recipient". It returns `reversed` and `pending` examples (`txn_005`, `txn_003`).

<!-- TODO(author): link the mock API's source repository here. -->

**Deterministic mock for tests:** `src/test/mock-bank.ts` is an in-memory implementation of this contract, plugged in as an axios adapter. Its scenarios are chosen explicitly per test:

- `successful`
- `pending` (settled by `settle()`)
- `timeout-after-processing`: the server records the transfer, then the client times out
- `server-error`
- insufficient funds
- expired session (401)

Idempotency is honoured by key.

> The mock idempotency mechanism demonstrates the client contract. It is **not** evidence of production-grade financial guarantees.

---

## Testing

```bash
npm test   # 83 tests, 7 suites, ~3 s, no network
```

| Brief requirement | Covered in |
| --- | --- |
| Money parsing and formatting, float traps | `money.test.ts` |
| Transfer validation and limits | `schema.test.ts` |
| Fee and total-debit calculation (Scenario 6) | `money.test.ts`, integration test |
| Transaction filtering (filters combine, stable dates) | `transactions.test.ts`, `use-transaction-history.test.tsx` |
| Duplicate transactions across pages (Scenario 2) | `transactions.test.ts`, `use-transaction-history.test.tsx` |
| Stale-request protection and cancellation (Scenario 1) | `use-transaction-history.test.tsx` |
| Refresh failure keeps data (Scenario 5); empty vs failed | `use-transaction-history.test.tsx` |
| Submission locking and idempotency-key reuse | `transfer-coordinator.test.ts` |
| Unknown outcomes and app restart (Scenarios 3, 7) | `transfer-coordinator.test.ts`, integration test |
| API error handling, no raw server text | `errors.test.ts` |
| Session expiry fires once, no retry (Scenario 8) | integration test |
| Malformed responses rejected | integration test |
| **Complete transfer journey against the mock service** | `transfer-journey.integration.test.ts`: real axios client, interceptors, zod parsing and coordinator against the mock bank |

### Not tested yet, and why

- **Component and screen tests** (rendering Home, Transactions, Details and the transfer screens). There wasn't time. The logic these screens depend on is tested at the hook, coordinator and service level, but the wiring inside the screens is not. Next to add:
  - the details screen's status-change banner (Scenario 4) — status polling itself is configured but not tested yet;
  - the PIN screen routing to Verify on an unknown outcome;
  - balance hide/reveal persistence.
- **Navigation:** the double-tap guard and back-button blocking need a navigation test harness (Expo Router test utilities) or end-to-end tests.
- **End-to-end tests** on a device (e.g. Maestro), for offline toggling, app kill and relaunch, and accessibility checks with VoiceOver / TalkBack. These were checked by hand only.
- **The hosted mock API itself:** tests use the in-memory mock to stay deterministic and network-free.

---

## Known limitations

- **No real authentication.** The mock API has no login, so "Session expired → Sign in again" starts a new session. 401 handling is real, but is only triggered in tests.
- **PIN not verified.** Any 4 digits are accepted; there is no PIN endpoint in the contract.
- **Fee rule duplicated.** The client mirrors the mock API's flat ₦25 fee. A real fee should come from a server quote.
- **Date range presets only** (7, 30, 90 days); there is no custom date picker.
- **Verification by replay.** Verifying an unknown outcome re-sends the stored request with the same key; there's no lookup-by-key endpoint. If the original never arrived, that replay performs the transfer for the first time. This is still exactly-once for that intent, but it depends on the server honouring keys.
- **Placeholder screens:** the *Scan* and *Messages* tabs, the onboarding artwork, and the Settings menu items are placeholders. Dark mode is not implemented (the app is light only).
- **Web** is a development preview only. Secure storage falls back to `localStorage` there.

## Before production

- **Auth:** real authentication (OAuth/OIDC, short-lived tokens with refresh, tokens in secure storage), device binding, and step-up auth (PIN/biometrics) checked **server-side** before a transfer.
- **Transfer lookup:** a server endpoint to look up a transfer by idempotency key, so verification never needs a replay. Keys should have a server-side expiry, and a reused key with a different body should be rejected.
- **Server quotes:** a fee quote and limits from the server (per-transaction, daily, KYC tier), shown on review and enforced server-side.
- **Push notifications** for status changes instead of polling only. A reconciliation job for transfers left pending.
- **Security:**
  - certificate pinning;
  - jailbreak/root detection;
  - screenshot blocking on sensitive screens;
  - hiding the app preview in the task switcher;
  - clearing secure storage on sign-out (the pending-transfer record needs a defined policy).
- **Observability:** crash reporting and analytics with PII scrubbing, request correlation ids, and audit logging.
- **Quality:** feature-level component and E2E tests in CI, accessibility audits, localisation, dark mode, and remote config for limits.
- **Delivery:** EAS Build with separate environments (dev, staging, prod) and signed OTA updates.

---

## Screenshots

<!-- TODO(author): add screenshots or a short recording of: home (balance hidden/shown), transaction history with filters, transaction details (pending → successful, reversed), transfer review, unknown-outcome verification, offline banner, session expired. -->

---

## AI tool usage

<!-- TODO(author): confirm or edit this disclosure so it matches how you worked. -->

This project was built with help from **Claude Code** (Anthropic), used for:
- scaffolding screens and components;
- auditing the codebase against the brief;
- implementing parts of the domain logic and tests;
- drafting this README.

All code was reviewed, run and tested by the author, who can explain and maintain every part of it.
