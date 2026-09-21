#!/usr/bin/env node
// Node.js provides this builtin at runtime; the project does not currently
// include Node.js type definitions, so suppress only this module-resolution
// diagnostic until @types/node is added.
// @ts-ignore
import { parseArgs } from "node:util";
import { RemitaCheckoutClient } from "./client";
import type { RemitaEnvironment } from "./environment";

function printUsage(): void {
  console.log(`
remita-checkout <command> [options]

Commands:
  pre         Pre-payment initialization
  fee         Calculate channel fee
  initiate    Initiate a payment
  authorize   Submit authorization params to an actionUrl
  validate    Validate second-factor authorization (e.g. OTP)
  verify      Verify payment status by reference
  stream      Stream real-time status updates (SSE) for a transaction
  banks       List supported banks
  ussd        List USSD codes
  wallets     List wallet types

Global options:
  --key <publicKey>            Remita public key (required for most commands)
  --env <qa|demo|production>   Explicit environment (skips prefix detection)
  --base-url <url>             Override the resolved base URL entirely
  --json                       Print raw JSON only, useful for piping

Command-specific options:
  pre:        --rrr <rrr> | --txn <transactionId>
  fee:        --amount <amount> --channel <channel>
  initiate:   --amount <amount> --channel <channel> [--txn <transactionId>]
  authorize:  --action-url <url> --payload '<json>'
  validate:   --payload '<json>' [--action-url <url>] [--ref <paymentReference>] [--otp <otp>]
  verify:     --ref <paymentReference>
  stream:     --trx <trxRef>

Examples:
  remita-checkout pre --key QA-abc123 --rrr 123456789
  remita-checkout initiate --key QA-abc123 --amount 5000 --channel card --json
  remita-checkout stream --key QA-abc123 --trx TRX-001
`);
}

type ParsedValues = Record<string, string | boolean | undefined>;

function buildClient(values: ParsedValues): RemitaCheckoutClient {
  const key = values.key as string | undefined;
  if (!key) throw new Error("--key is required.");

  const baseUrl = values["base-url"] as string | undefined;

  return new RemitaCheckoutClient({
    publicKey: key,
    environment: values.env as RemitaEnvironment | undefined,
    baseUrls: baseUrl ? { qa: baseUrl, demo: baseUrl, production: baseUrl } : undefined,
    onEnvironmentDetectionFallback: (guessed) => {
      if (!values.json) {
        console.error(`(couldn't detect environment from key prefix, defaulting to "${guessed}")`);
      }
    },
  });
}

function output(values: ParsedValues, label: string, data: unknown): void {
  if (values.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  console.log(`\n${label}:`);
  console.log(JSON.stringify(data, null, 2));
}

function parsePayload(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`--payload must be valid JSON, e.g. --payload '{"otp":"123456"}'`);
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      key: { type: "string" },
      env: { type: "string" },
      "base-url": { type: "string" },
      json: { type: "boolean", default: false },
      rrr: { type: "string" },
      txn: { type: "string" },
      amount: { type: "string" },
      channel: { type: "string" },
      "action-url": { type: "string" },
      payload: { type: "string" },
      ref: { type: "string" },
      otp: { type: "string" },
      trx: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  const command = positionals[0];

  if (!command || values.help) {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  try {
    switch (command) {
      case "pre": {
        const client = buildClient(values);
        const result = await client.prePayment({
          publicKey: client.publicKey,
          rrr: values.rrr as string | undefined,
          transactionId: values.txn as string | undefined,
        });
        output(values, "Pre-payment response", result);
        break;
      }

      case "fee": {
        const client = buildClient(values);
        if (!values.amount || !values.channel) {
          throw new Error("fee requires --amount and --channel.");
        }
        const result = await client.calculateFee({
          publicKey: client.publicKey,
          amount: Number(values.amount),
          channel: values.channel as string,
        });
        output(values, "Fee response", result);
        break;
      }

      case "initiate": {
        const client = buildClient(values);
        if (!values.amount || !values.channel) {
          throw new Error("initiate requires --amount and --channel.");
        }
        const result = await client.initiatePayment({
          publicKey: client.publicKey,
          amount: Number(values.amount),
          channel: values.channel as string,
          transactionId: values.txn as string | undefined,
        });
        output(values, "Initiate response", result);
        break;
      }

      case "authorize": {
        const client = buildClient(values);
        const actionUrl = values["action-url"] as string | undefined;
        if (!actionUrl) throw new Error("authorize requires --action-url.");
        const result = await client.authorize(
          actionUrl,
          parsePayload(values.payload as string | undefined)
        );
        output(values, "Authorize response", result);
        break;
      }

      case "validate": {
        const client = buildClient(values);
        const payload = parsePayload(values.payload as string | undefined);
        const result = await client.validatePayment(
          {
            paymentReference: values.ref as string | undefined,
            otp: values.otp as string | undefined,
            ...payload,
          },
          values["action-url"] as string | undefined
        );
        output(values, "Validate response", result);
        break;
      }

      case "verify": {
        const client = buildClient(values);
        const ref = values.ref as string | undefined;
        if (!ref) throw new Error("verify requires --ref.");
        const result = await client.verifyPayment(ref);
        output(values, "Verify response", result);
        break;
      }

      case "stream": {
        const client = buildClient(values);
        const trx = values.trx as string | undefined;
        if (!trx) throw new Error("stream requires --trx.");
        console.error(`Streaming status for ${trx}. Ctrl+C to stop.`);
        const handle = client.streamPaymentStatus(trx, {
          onOpen: () => console.error("(stream open)"),
          onMessage: (event) => console.log(JSON.stringify(event.data, null, 2)),
          onError: (err) => {
            console.error("Stream error:", err);
            process.exitCode = 1;
          },
        });
        process.on("SIGINT", () => {
          handle.close();
          process.exit(0);
        });
        await new Promise(() => {}); // keep the process alive until Ctrl+C
        break;
      }

      case "banks": {
        const client = buildClient(values);
        output(values, "Bank list", await client.getBankList());
        break;
      }

      case "ussd": {
        const client = buildClient(values);
        output(values, "USSD codes", await client.getUssdCodes());
        break;
      }

      case "wallets": {
        const client = buildClient(values);
        output(values, "Wallet types", await client.getWalletTypes());
        break;
      }

      default:
        console.error(`Unknown command: ${command}\n`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

main();
