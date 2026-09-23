Remita CLI Tools

A collection of command-line tools for integrating with and testing Remita APIs directly from your terminal.

The Remita CLI tools are designed for developers who need to test integrations, inspect API responses, automate payment and transfer workflows, and debug Remita integrations without building a separate application first.

CLI Tools

This project currently provides two complementary Remita command-line tools:

CLI

Purpose

remita

General-purpose Remita developer CLI for services such as funds transfer, bank information, account name enquiry, transfer queries, and vending

remita-checkout

Remita Checkout CLI for the complete payment lifecycle, from pre-payment through verification

remita

The general-purpose Remita developer CLI provides command-line access to Remita API services.

Current functionality includes:

Funds transfer

Bank listing

Account name enquiry

Transfer operations

Transfer status and query operations

Bulk transfer queries

Vending services

Install globally from npm:

npm install -g remita-cli

Verify the installation:

remita --help

View the funds-transfer commands:

remita funds-transfer --help

List supported banks:

remita funds-transfer banks list

The CLI is structured as a developer-facing wrapper around Remita APIs, keeping API interaction available from the terminal for integration testing, debugging, and automation.

remita-checkout

The Checkout CLI is focused specifically on the Remita Checkout API.

It supports the full payment lifecycle:

pre-payment → fee → initiate → authorize → validate → verify

It also provides:

Real-time transaction status streaming

Bank listing

USSD information

Wallet information

QA, Demo, and Production environments

JSON output for automation

Programmatic access through the Checkout client

Verify the installation:

remita-checkout --help

Which CLI should I use?

Use remita when working with general Remita developer services such as funds transfer, bank information, account enquiries, transfer queries, and vending.

Use remita-checkout when working specifically with the Remita Checkout payment lifecycle.

Together, the tools provide a broader command-line toolkit for Remita development.

Table of contents

CLI Tools

remita

remita-checkout

Which CLI should I use?

Checkout CLI Install

Checkout Quick start

Environments & keys

Checkout Commands

pre

fee

initiate

authorize

validate

verify

stream

banks

ussd

wallets

Global options

Programmatic use

Full payment flow example

Troubleshooting

Security notes

What the Checkout CLI does not do

General Remita CLI Reference

Installation

npm install -g remita-cli

Verify the installation

remita --help

Funds transfer

remita funds-transfer --help

List banks

remita funds-transfer banks list

The general remita CLI is intended for developer-facing Remita API workflows. Its current command surface includes funds transfer, bank listing, account name enquiry, transfer operations, transfer status/query operations, bulk transfer queries, and vending.

The exact options exposed by each command can be viewed directly from the terminal:

remita <command> --help

Checkout CLI Install

# from source
git clone <your-repo-url>
cd payment-checkout
npm install
npm run build

# link it locally so `remita-checkout` is on your PATH
npm link

Or run without installing:

node ./dist/cli.js <command> [options]

Verify the install:

remita-checkout --help

Requires Node.js 18+ (uses the built-in fetch and parseArgs).

Checkout Quick start

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

Add --json to any command for pipe-friendly output:

remita-checkout banks --key pk_test_xxxx --json | jq '.banks | length'

Environments & keys

The CLI routes requests based on the --env flag, falling back to
key-prefix detection when --env is omitted.

Environment

Base URL

qa

https://api-checkout-qa.systemspecsng.com/api/v1

demo

https://api-checkout-demo.systemspecsng.com/api/v1

production

https://api-checkout.systemspecsng.com/api/v1

Prefix detection rules:

Key prefix

Detected environment

qa-, qa_, pk_qa_

qa

demo-, demo_, pk_demo_, pk_test_

demo

anything else

falls back to qa with a warning

Production keys are never auto-detected. To hit production you must
pass --env production explicitly. This is intentional — misrouting a
live transaction is worse than failing loudly.

Example — production:

remita-checkout pre --env production --key pk_live_xxxx ...

Checkout Commands

pre

Pre-payment initialization. Validates the customer/payment details and
returns merchant info, amount, currency, and available payment channels.

Option

Required

Description

--first-name <name>

✅

Customer first name

--last-name <name>

✅

Customer last name

--email <email>

✅

Customer email

--phone-number <phone>

✅

Customer phone number

--payment-identifier <id>

✅

Merchant payment identifier

--currency <code>

✅

Currency code (e.g. NGN)

--narration <text>



Optional payment narration

--amount <amount>

✅

Amount to charge

remita-checkout pre \
  --env qa \
  --key pk_test_xxxx \
  --first-name Ujunwa \
  --last-name Cynthia \
  --email asa@ya.com \
  --phone-number 08067493790 \
  --payment-identifier QQ9845555554 \
  --currency NGN \
  --narration "school fee on demand" \
  --amount 10000

fee

Calculates the channel-specific processing fee for a given amount.

Option

Required

Description

--amount <amount>

✅

Transaction amount

--channel <channel>

✅

Payment channel (e.g. card, ussd)

remita-checkout fee --key pk_test_xxxx --amount 10000 --channel card

initiate

Initiates a payment on the chosen channel. The response typically contains
a paymentReference, transactionId, and possibly an actionUrl for the
next authorization step.

Option

Required

Description

--amount <amount>

✅

Transaction amount

--channel <channel>

✅

Payment channel

--txn <transactionId>



Optional transaction id to correlate

remita-checkout initiate --key pk_test_xxxx --amount 10000 --channel card --txn TRX-001

authorize

Posts authorization params (OTP, PIN, 3DS form fields) to a processor-provided
actionUrl.

Option

Required

Description

--action-url <url>

✅

Processor action URL

--payload '<json>'

✅

Authorization payload as JSON

--content-type <mime>



Override content type (see below)

For OTP / PIN style steps, JSON is correct:

remita-checkout authorize \
  --key pk_test_xxxx \
  --action-url https://processor.example/auth \
  --payload '{"otp":"123456"}'

For CyberSource / Cardinal 3DS endpoints, use form encoding:

remita-checkout authorize \
  --key pk_test_xxxx \
  --action-url https://cas.client.cardinaltrusted.com/centinelapi/V1/Cruise/Collect \
  --content-type application/x-www-form-urlencoded \
  --payload '{"JWT":"...","ReferenceId":"..."}'

validate

Validates second-factor authorization (e.g. OTP). Targets /payment/validate
by default, or a custom actionUrl if provided.

Option

Required

Description

--payload '<json>'



Validation payload as JSON

--otp <otp>



Shortcut for --payload '{"otp":"..."}'

--ref <paymentReference>



Payment reference

--action-url <url>



Override the validate endpoint

remita-checkout validate --key pk_test_xxxx --ref PR-123456 --otp 123456

verify

Mandatory step. Queries the transaction status on the server. Never grant
value based solely on the frontend onSuccess callback.

Option

Required

Description

--ref <paymentReference>

✅

Payment reference (or transaction id)

remita-checkout verify --key pk_test_xxxx --ref PR-123456

Response statuses: APPROVED, PENDING, FAILED.

stream

Opens a Server-Sent Events (SSE) stream for real-time status updates.
Runs until you press Ctrl+C.

Option

Required

Description

--trx <trxRef>

✅

Transaction reference to subscribe to

remita-checkout stream --key pk_test_xxxx --trx TRX-001

Each event is printed as JSON. A message is written to stderr when the
stream opens, so --json output on stdout stays pipeable:

remita-checkout stream --key pk_test_xxxx --trx TRX-001 --json | jq -c '.status'

banks

Lists supported banks and currencies (for Bank Transfer and PAPSS channels).

remita-checkout banks --key pk_test_xxxx

ussd

Lists USSD bank codes for the USSD payment channel.

remita-checkout ussd --key pk_test_xxxx

wallets

Lists available e-wallet options.

remita-checkout wallets --key pk_test_xxxx

Global options

These apply to every command:

Option

Description

--key <publicKey>

Remita public key. Required for every command.

--env <qa|demo|production>

Explicit environment. Skips prefix detection.

--base-url <url>

Override the resolved base URL entirely (useful for staging mirrors).

--json

Print raw JSON only. Ideal for piping to jq.

--help

Show the help text.

Programmatic use

The CLI is a thin wrapper over RemitaCheckoutClient, which you can use
directly in Node or the browser:

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

// For OTP-style authorization
await session.authorize({ otp: "123456" });

// For 3DS form-post
await session.authorize(
  { JWT: "...", ReferenceId: "..." },
  undefined,
  "application/x-www-form-urlencoded"
);

const status = await session.verify();
console.log(status.status); // "APPROVED" | "PENDING" | "FAILED"

Streaming from code

const handle = client.streamPaymentStatus("TRX-001", {
  onOpen: () => console.log("stream open"),
  onMessage: (event) => console.log(event.data),
  onError: (err) => console.error(err),
});

// later
handle.close();

Full payment flow example

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

Troubleshooting

couldn't detect environment from key prefix, defaulting to "qa"

Your key doesn't match a known prefix. Pass --env explicitly:

remita-checkout pre --env qa --key <your-key> ...

401 Unauthorized / 403 Forbidden

Check the key is valid for the environment you're hitting.

Production keys must be used with --env production; QA keys with --env qa.

If you just added the key, confirm the merchant account is activated for
the target environment.

--payload must be valid JSON

Shell quoting issue. Wrap the JSON in single quotes:

--payload '{"otp":"123456"}'    # ✅
--payload "{\"otp\":\"123456\"}" # also works but ugly
--payload {"otp":"123456"}       # ❌ shell eats the braces

415 Unsupported Media Type on authorize

You're hitting a 3DS endpoint that requires form encoding. Add:

--content-type application/x-www-form-urlencoded

stream prints nothing

Confirm the --trx value is correct and the transaction exists.

Events are only emitted when status changes. Some transactions sit in
PENDING for a while before the first event.

Try without --json to see the open/error messages on stderr.

Stream fails immediately with a network error

The stream endpoint uses a query-param publicKey and Accept: text/event-stream.
If your network/proxy strips SSE, you'll see a fetch failure. Retry on a
different network, or use the verify command as a polling fallback.

Security notes

Never commit --key values or paste them into shared logs. Prefer
environment variables:

export REMITA_KEY="pk_test_xxxx"
remita-checkout pre --key "$REMITA_KEY" ...

Public keys only. This CLI talks to the Checkout API, which is designed
for public keys. Do not pass sk_live_... secret keys to it.

Always verify server-side. The frontend/CLI verify call is for
convenience and debugging. Your production backend must independently
re-query transaction status before granting value.

Production requires explicit opt-in. --env production is mandatory;
the CLI will never route to production from key-prefix detection alone.

What the Checkout CLI does not do

These belong on your backend server and are intentionally out of scope
for this client:

Feature

Endpoint

RRR generation

POST {baseUrl}/remita/exapp/api/v1/.../paymentinit

Requery by order ID

GET {baseUrl}/remita/exapp/api/v1/.../{merchantId}/{orderId}/{apiHash}/orderstatus.reg

Requery by RRR

GET {baseUrl}/remita/exapp/api/v1/.../{merchantId}/{rrr}/{apiHash}/status.reg

Webhook / IPN receiver

Your own POST /api/remita-webhook

Return / callback redirect

Your own GET /payment/callback

Connect API charge (/payment-engine/payment/charge)

Server-to-server only; uses secretKey

Those endpoints use a secretKey and an apiHash (SHA-512 of
reference + API key + merchant ID) — secrets that must never leave your
server. The CLI deliberately exposes only the public-key Checkout API.

License

MIT (or your project's license).

Support

Remita developer docs: https://remita.net

Merchant dashboard: https://login.remita.net
