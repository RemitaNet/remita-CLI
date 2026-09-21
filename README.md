# remita-checkout-client

A typed client for the Remita Checkout REST API (`api-checkout*.systemspecsng.com`).
Works in the browser and in Node 18+ (both have global `fetch`).

## ⚠️ Before you use this in anything real

The request/response **field names** in `src/types.ts` were written from
endpoint paths + one-line descriptions only — not the actual DTOs. Every
interface has an index signature so unexpected fields won't break at the
type level, but treat the field names themselves as **unverified**. To
tighten them, pull the actual interfaces out of:

- `remita-api-client.service.ts`
- `payment-status.service.ts`

and update `src/types.ts` to match. The transport layer, URLs, HTTP
methods, and the pre → fee → initiate → authorize → validate → verify
sequencing are all solid; it's specifically the shape of each request/
response body that needs confirming.

The **environment auto-detection from key prefix** (`src/environment.ts`)
is also a guess (Stripe-style `pk_test_`/`pk_live_` conventions) — it has
not been verified against Remita's real key format. It intentionally never
silently resolves to `"production"` — an unrecognized prefix falls back to
`"qa"` and reports `detected: false` so you can log/warn on it. Until you
verify the real prefixes, pass `environment` explicitly and skip detection.

## Install

```bash
npm install remita-checkout-client
```

## Usage

### Low-level client

```ts
import { RemitaCheckoutClient } from "remita-checkout-client";

const client = new RemitaCheckoutClient({
  publicKey: "YOUR_PUBLIC_KEY",
  // environment: "qa", // recommended explicitly until prefix detection is verified
  onEnvironmentDetectionFallback: (guessed) =>
    console.warn(`Couldn't detect environment from key prefix, defaulting to ${guessed}`),
});

const pre = await client.prePayment({ publicKey: client.publicKey, rrr: "RRR12345" });
const fee = await client.calculateFee({ publicKey: client.publicKey, amount: 5000, channel: "card" });
const initiated = await client.initiatePayment({ publicKey: client.publicKey, amount: 5000, channel: "card" });

if (initiated.actionUrl) {
  await client.authorize(initiated.actionUrl, { /* OTP / PIN / 3DS fields */ });
}

const verified = await client.verifyPayment(initiated.paymentReference!);
console.log(verified.status); // "APPROVED" | "PENDING" | "FAILED" | ...
```

### Higher-level session (tracks refs between steps for you)

```ts
import { RemitaCheckoutClient, PaymentSession } from "remita-checkout-client";

const client = new RemitaCheckoutClient({ publicKey: "YOUR_PUBLIC_KEY", environment: "qa" });
const session = new PaymentSession(client);

await session.pre({ publicKey: client.publicKey, rrr: "RRR12345" });
await session.fee({ publicKey: client.publicKey, amount: 5000, channel: "card" });
await session.initiate({ publicKey: client.publicKey, amount: 5000, channel: "card" });

// actionUrl from initiate() is remembered automatically
await session.authorize({ otp: "123456" });
await session.validate({ otp: "123456" });

const result = await session.verify(); // uses paymentReference captured from initiate()
console.log(session.stage, result.status);
```

### Real-time status via SSE

```ts
const handle = client.streamPaymentStatus(trxRef, {
  onOpen: () => console.log("stream open"),
  onMessage: (event) => console.log("status update:", event.data),
  onError: (err) => console.error("stream error:", err),
});

// later
handle.close();
```

This is implemented as a manual `fetch` + `ReadableStream` reader (not the
browser-only `EventSource` global), so it behaves the same in the browser
and in Node.

### Channel config endpoints

```ts
const banks = await client.getBankList();
const ussdCodes = await client.getUssdCodes();
const wallets = await client.getWalletTypes();
```

## Node < 18

Global `fetch` isn't available before Node 18. Pass a `fetchImpl` explicitly:

```ts
import fetch from "node-fetch";

const client = new RemitaCheckoutClient({
  publicKey: "...",
  environment: "qa",
  fetchImpl: fetch as unknown as typeof globalThis.fetch,
});
```

## Not covered in this version

Per the agreed v1 scope, this does **not** include:

- Google Pay / Apple Pay config endpoints (`/misc/googlepay`, `/misc/applepay`)
- CyberSource / Cardinal 3DS flow (Cruise Collect iframe, Centinel API, the
  return listener endpoint)

Both are separate, non-trivial integrations (iframe orchestration for DDC,
CyberSource's Accept.js script loading) — worth their own follow-up rather
than bolting on here.

## Development

```bash
npm install
npm run typecheck
npm run build   # outputs dist/ as CJS + ESM + .d.ts
```
