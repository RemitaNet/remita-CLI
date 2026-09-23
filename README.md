<div align="center">

# 🧾 Remita CLI Tools

**Command-line tools for integrating with and testing Remita APIs — right from your terminal.**

Test integrations · Inspect API responses · Automate payment & transfer workflows · Debug without building an app first

[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](#license)
[![npm](https://img.shields.io/badge/npm-remita--cli-cb3837)](#)

</div>

---

## 📦 Two CLIs, One Toolkit

| CLI | Purpose |
|---|---|
| **`remita`** | General-purpose developer CLI — funds transfer, bank info, account name enquiry, transfer queries, vending |
| **`remita-checkout`** | Focused CLI for the full **Checkout payment lifecycle** — pre-payment through verification |

> 💡 **Which one do I need?**
> Use `remita` for general account/transfer operations. Use `remita-checkout` when you're building or debugging a payment flow.

---

## 📖 Table of Contents

<table>
<tr>
<td valign="top">

**General `remita` CLI**
- [Installation](#-general-remita-cli)
- [Funds transfer](#-general-remita-cli)
- [List banks](#-general-remita-cli)

**`remita-checkout` CLI**
- [Install](#️-checkout-cli-install)
- [Quick start](#-checkout-quick-start)
- [Environments & keys](#-environments--keys)

</td>
<td valign="top">

**Commands**
- [pre](#pre) · [fee](#fee) · [initiate](#initiate)
- [authorize](#authorize) · [validate](#validate)
- [verify](#verify) · [stream](#stream)
- [banks](#banks) · [ussd](#ussd) · [wallets](#wallets)
- [Global options](#️-global-options)

</td>
<td valign="top">

**More**
- [Programmatic use](#-programmatic-use)
- [Full flow example](#-full-payment-flow-example)
- [Troubleshooting](#-troubleshooting)
- [Security notes](#-security-notes)
- [Out of scope](#-what-the-checkout-cli-does-not-do)

</td>
</tr>
</table>

---

## 🔧 General `remita` CLI

Command-line access to general-purpose Remita API services.

**Current functionality:**

✅ Funds transfer &nbsp;·&nbsp; ✅ Bank listing &nbsp;·&nbsp; ✅ Account name enquiry &nbsp;·&nbsp; ✅ Transfer operations
✅ Transfer status & query &nbsp;·&nbsp; ✅ Bulk transfer queries &nbsp;·&nbsp; ✅ Vending services

```bash
# Install globally
npm install -g remita-cli

# Verify installation
remita --help

# Funds-transfer commands
remita funds-transfer --help

# List supported banks
remita funds-transfer banks list
```

For any command, the exact options are always one flag away:

```bash
remita <command> --help
```

---

## 💳 `remita-checkout` CLI

Everything you need for the **Checkout API** payment lifecycle:

```
pre-payment  →  fee  →  initiate  →  authorize  →  validate  →  verify
```

Also included: real-time status streaming, bank/USSD/wallet listings, QA/Demo/Production environments, JSON output for automation, and a programmatic client.

### ⚙️ Checkout CLI Install

```bash
# from source
git clone <your-repo-url>
cd payment-checkout
npm install
npm run build

# link it locally so `remita-checkout` is on your PATH
npm link
```

Or run without installing:

```bash
node ./dist/cli.js <command> [options]
```

```bash
remita-checkout --help
```

> ⚠️ **Requires Node.js 18+** (uses the built-in `fetch` and `parseArgs`).

### 🚀 Checkout Quick Start

```bash
# 1. Pre-payment — validate the transaction and fetch merchant info
remita-checkout pre \
  --env qa \
  --key pk_test_xxxxxxxxxxxxxxxx \
  --first-name Ujunwa \
  --last-name Cynthia \
  --email asa@ya.com \
  --phone-number 08067493790 \
  --payment-identifier QQ9845555554 \
  --currency NGN \
  --narration "school fee on demand" \
  --amount 10000

# 2. Calculate the channel fee
remita-checkout fee --key pk_test_xxxx --amount 10000 --channel card

# 3. Initiate the payment
remita-checkout initiate --key pk_test_xxxx --amount 10000 --channel card --txn TRX-001

# 4. Verify the final status (mandatory before granting value)
remita-checkout verify --key pk_test_xxxx --ref PR-123456
```

Add `--json` to any command for pipe-friendly output:

```bash
remita-checkout banks --key pk_test_xxxx --json | jq '.banks | length'
```

### 🌍 Environments & Keys

The CLI routes requests based on `--env`, falling back to key-prefix detection when it's omitted.

| Environment | Base URL |
|---|---|
| `qa` | `https://api-checkout-qa.systemspecsng.com/api/v1` |
| `demo` | `https://api-checkout-demo.systemspecsng.com/api/v1` |
| `production` | `https://api-checkout.systemspecsng.com/api/v1` |

**Prefix detection rules:**

| Key prefix | Detected environment |
|---|---|
| `qa-`, `qa_`, `pk_qa_` | qa |
| `demo-`, `demo_`, `pk_demo_`, `pk_test_` | demo |
| anything else | falls back to `qa` with a warning |

> 🚨 **Production keys are never auto-detected.** To hit production you must pass `--env production` explicitly — misrouting a live transaction is worse than failing loudly.

```bash
remita-checkout pre --env production --key pk_live_xxxx ...
```

---

## 🛠️ Checkout Commands

### `pre`
Pre-payment initialization. Validates the customer/payment details and returns merchant info, amount, currency, and available payment channels.

| Option | Required | Description |
|---|:---:|---|
| `--first-name <name>` | ✅ | Customer first name |
| `--last-name <name>` | ✅ | Customer last name |
| `--email <email>` | ✅ | Customer email |
| `--phone-number <phone>` | ✅ | Customer phone number |
| `--payment-identifier <id>` | ✅ | Merchant payment identifier |
| `--currency <code>` | ✅ | Currency code (e.g. `NGN`) |
| `--narration <text>` |  | Optional payment narration |
| `--amount <amount>` | ✅ | Amount to charge |

```bash
remita-checkout pre \
  --env qa --key pk_test_xxxx \
  --first-name Ujunwa --last-name Cynthia \
  --email asa@ya.com --phone-number 08067493790 \
  --payment-identifier QQ9845555554 \
  --currency NGN --narration "school fee on demand" \
  --amount 10000
```

### `fee`
Calculates the channel-specific processing fee for a given amount.

| Option | Required | Description |
|---|:---:|---|
| `--amount <amount>` | ✅ | Transaction amount |
| `--channel <channel>` | ✅ | Payment channel (e.g. `card`, `ussd`) |

```bash
remita-checkout fee --key pk_test_xxxx --amount 10000 --channel card
```

### `initiate`
Initiates a payment on the chosen channel. Returns a `paymentReference`, `transactionId`, and possibly an `actionUrl` for the next authorization step.

| Option | Required | Description |
|---|:---:|---|
| `--amount <amount>` | ✅ | Transaction amount |
| `--channel <channel>` | ✅ | Payment channel |
| `--txn <transactionId>` |  | Optional transaction id to correlate |

```bash
remita-checkout initiate --key pk_test_xxxx --amount 10000 --channel card --txn TRX-001
```

### `authorize`
Posts authorization params (OTP, PIN, 3DS form fields) to a processor-provided `actionUrl`.

| Option | Required | Description |
|---|:---:|---|
| `--action-url <url>` | ✅ | Processor action URL |
| `--payload '<json>'` | ✅ | Authorization payload as JSON |
| `--content-type <mime>` |  | Override content type (see below) |

OTP / PIN style steps → JSON:

```bash
remita-checkout authorize \
  --key pk_test_xxxx \
  --action-url https://processor.example/auth \
  --payload '{"otp":"123456"}'
```

CyberSource / Cardinal 3DS endpoints → form encoding:

```bash
remita-checkout authorize \
  --key pk_test_xxxx \
  --action-url https://cas.client.cardinaltrusted.com/centinelapi/V1/Cruise/Collect \
  --content-type application/x-www-form-urlencoded \
  --payload '{"JWT":"...","ReferenceId":"..."}'
```

### `validate`
Validates second-factor authorization (e.g. OTP). Targets `/payment/validate` by default, or a custom `actionUrl` if provided.

| Option | Required | Description |
|---|:---:|---|
| `--payload '<json>'` |  | Validation payload as JSON |
| `--otp <otp>` |  | Shortcut for `--payload '{"otp":"..."}'` |
| `--ref <paymentReference>` |  | Payment reference |
| `--action-url <url>` |  | Override the validate endpoint |

```bash
remita-checkout validate --key pk_test_xxxx --ref PR-123456 --otp 123456
```

### `verify`
🔒 **Mandatory step.** Queries the transaction status on the server. Never grant value based solely on the frontend `onSuccess` callback.

| Option | Required | Description |
|---|:---:|---|
| `--ref <paymentReference>` | ✅ | Payment reference (or transaction id) |

```bash
remita-checkout verify --key pk_test_xxxx --ref PR-123456
```

Response statuses: `APPROVED` · `PENDING` · `FAILED`

### `stream`
Opens a Server-Sent Events (SSE) stream for real-time status updates. Runs until you press <kbd>Ctrl</kbd>+<kbd>C</kbd>.

| Option | Required | Description |
|---|:---:|---|
| `--trx <trxRef>` | ✅ | Transaction reference to subscribe to |

```bash
remita-checkout stream --key pk_test_xxxx --trx TRX-001
```

Each event prints as JSON. The "stream open" message goes to `stderr`, so `--json` output on `stdout` stays pipeable:

```bash
remita-checkout stream --key pk_test_xxxx --trx TRX-001 --json | jq -c '.status'
```

### `banks`
Lists supported banks and currencies (for Bank Transfer and PAPSS channels).

```bash
remita-checkout banks --key pk_test_xxxx
```

### `ussd`
Lists USSD bank codes for the USSD payment channel.

```bash
remita-checkout ussd --key pk_test_xxxx
```

### `wallets`
Lists available e-wallet options.

```bash
remita-checkout wallets --key pk_test_xxxx
```

---

## ⚙️ Global Options

_Apply to every command:_

| Option | Description |
|---|---|
| `--key <publicKey>` | Remita public key. **Required** for every command. |
| `--env <qa\|demo\|production>` | Explicit environment. Skips prefix detection. |
| `--base-url <url>` | Override the resolved base URL entirely (useful for staging mirrors). |
| `--json` | Print raw JSON only. Ideal for piping to `jq`. |
| `--help` | Show the help text. |

---

## 🧑‍💻 Programmatic Use

The CLI is a thin wrapper over `RemitaCheckoutClient`, usable directly in Node or the browser:

```ts
import { RemitaCheckoutClient, PaymentSession } from "remita-checkout";

const client = new RemitaCheckoutClient({
  publicKey: process.env.REMITA_PUBLIC_KEY!,
  environment: "qa",
});

// Low-level: call endpoints directly
const pre = await client.prePayment({
  firstName: "Ujunwa",
  lastName: "Cynthia",
  email: "asa@ya.com",
  phoneNumber: "08067493790",
  paymentIdentifier: "QQ9845555554",
  currency: "NGN",
  narration: "school fee on demand",
  amount: 10000,
});

// High-level: let PaymentSession thread refs between steps
const session = new PaymentSession(client);
await session.pre({ /* ... */ });
await session.fee({ amount: 10000, channel: "card" });
await session.initiate({ amount: 10000, channel: "card" });

// OTP-style authorization
await session.authorize({ otp: "123456" });

// 3DS form-post
await session.authorize(
  { JWT: "...", ReferenceId: "..." },
  undefined,
  "application/x-www-form-urlencoded"
);

const status = await session.verify();
console.log(status.status); // "APPROVED" | "PENDING" | "FAILED"
```

**Streaming from code:**

```ts
const handle = client.streamPaymentStatus("TRX-001", {
  onOpen: () => console.log("stream open"),
  onMessage: (event) => console.log(event.data),
  onError: (err) => console.error(err),
});

// later
handle.close();
```

---

## 🔁 Full Payment Flow Example

```bash
#!/usr/bin/env bash
set -euo pipefail

KEY="pk_test_xxxxxxxxxxxxxxxx"
ENV="qa"

echo "── Pre ──"
remita-checkout pre --env "$ENV" --key "$KEY" \
  --first-name Ujunwa --last-name Cynthia \
  --email asa@ya.com --phone-number 08067493790 \
  --payment-identifier QQ9845555554 \
  --currency NGN --narration "school fee" \
  --amount 10000 --json > pre.json

echo "── Fee ──"
remita-checkout fee --env "$ENV" --key "$KEY" \
  --amount 10000 --channel card --json > fee.json

echo "── Initiate ──"
remita-checkout initiate --env "$ENV" --key "$KEY" \
  --amount 10000 --channel card --txn TRX-001 --json > initiate.json

REF=$(jq -r '.paymentReference' initiate.json)
echo "paymentReference: $REF"

echo "── Verify ──"
remita-checkout verify --env "$ENV" --key "$KEY" --ref "$REF" --json
```

---

## 🩺 Troubleshooting

<details>
<summary><strong>couldn't detect environment from key prefix, defaulting to "qa"</strong></summary>
<br>

Your key doesn't match a known prefix. Pass `--env` explicitly:

```bash
remita-checkout pre --env qa --key <your-key> ...
```
</details>

<details>
<summary><strong>401 Unauthorized / 403 Forbidden</strong></summary>
<br>

- Check the key is valid for the environment you're hitting.
- Production keys must be used with `--env production`; QA keys with `--env qa`.
- If you just added the key, confirm the merchant account is activated for the target environment.
</details>

<details>
<summary><strong>--payload must be valid JSON</strong></summary>
<br>

Shell quoting issue. Wrap the JSON in single quotes:

```bash
--payload '{"otp":"123456"}'     # ✅
--payload "{\"otp\":\"123456\"}"  # also works but ugly
--payload {"otp":"123456"}        # ❌ shell eats the braces
```
</details>

<details>
<summary><strong>415 Unsupported Media Type on authorize</strong></summary>
<br>

You're hitting a 3DS endpoint that requires form encoding. Add:

```bash
--content-type application/x-www-form-urlencoded
```
</details>

<details>
<summary><strong>stream prints nothing</strong></summary>
<br>

- Confirm the `--trx` value is correct and the transaction exists.
- Events are only emitted when status changes — some transactions sit in `PENDING` for a while before the first event.
- Try without `--json` to see the open/error messages on `stderr`.
</details>

<details>
<summary><strong>Stream fails immediately with a network error</strong></summary>
<br>

The stream endpoint uses a query-param `publicKey` and `Accept: text/event-stream`. If your network/proxy strips SSE, you'll see a fetch failure. Retry on a different network, or use `verify` as a polling fallback.
</details>

---

## 🔐 Security Notes

- **Never commit `--key` values** or paste them into shared logs. Prefer environment variables:
  ```bash
  export REMITA_KEY="pk_test_xxxx"
  remita-checkout pre --key "$REMITA_KEY" ...
  ```
- **Public keys only.** This CLI talks to the Checkout API, which is designed for public keys. Do **not** pass `sk_live_...` secret keys to it.
- **Always verify server-side.** The frontend/CLI `verify` call is for convenience and debugging. Your production backend must independently re-query transaction status before granting value.
- **Production requires explicit opt-in.** `--env production` is mandatory — the CLI will never route to production from key-prefix detection alone.

---

## 🚫 What the Checkout CLI Does *Not* Do

These belong on your backend server and are intentionally out of scope for this client:

| Feature | Endpoint |
|---|---|
| RRR generation | `POST {baseUrl}/remita/exapp/api/v1/.../paymentinit` |
| Requery by order ID | `GET {baseUrl}/remita/exapp/api/v1/.../{merchantId}/{orderId}/{apiHash}/orderstatus.reg` |
| Requery by RRR | `GET {baseUrl}/remita/exapp/api/v1/.../{merchantId}/{rrr}/{apiHash}/status.reg` |
| Webhook / IPN receiver | Your own `POST /api/remita-webhook` |
| Return / callback redirect | Your own `GET /payment/callback` |
| Connect API charge | `/payment-engine/payment/charge` — server-to-server only, uses `secretKey` |

> Those endpoints use a `secretKey` and an `apiHash` (SHA-512 of reference + API key + merchant ID) — secrets that must never leave your server. The CLI deliberately exposes only the public-key Checkout API.

---

## 📄 License

MIT (or your project's license).

## 💬 Support

- 📚 Remita developer docs: [remita.net](https://remita.net)
- 🖥️ Merchant dashboard: [login.remita.net](https://login.remita.net)
