export interface ApiErrorPayload {
  responseCode?: string;
  responseMessage?: string;
  message?: string;
  [key: string]: unknown;
}

export class RemitaApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | undefined;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "RemitaApiError";
    this.status = status;
    this.payload = payload;
  }
}

/* -------------------------------------------------------------------- *
 * NOTE ON THE TYPES BELOW
 *
 * Only the endpoint list and one-line descriptions were available when
 * this client was generated — not the actual request/response bodies.
 * Every interface here is a best-effort guess based on standard payment-
 * gateway conventions and should be treated as UNVERIFIED until checked
 * against the real DTOs in remita-api-client.service.ts /
 * payment-status.service.ts. Index signatures are left in place so
 * extra or renamed fields don't break at the type level while you
 * tighten these.
 * -------------------------------------------------------------------- */

export interface PrePaymentRequest {
  publicKey: string;
  /** Either a transaction id or an RRR, per "validates transaction or RRR details". */
  transactionId?: string;
  rrr?: string;
  [key: string]: unknown;
}

export interface PaymentChannel {
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface PrePaymentResponse {
  merchantName?: string;
  amount?: number | string;
  currency?: string;
  channels?: PaymentChannel[];
  [key: string]: unknown;
}

export interface FeeChargeRequest {
  publicKey: string;
  amount: number;
  channel: string;
  [key: string]: unknown;
}

export interface FeeChargeResponse {
  fee?: number | string;
  totalAmount?: number | string;
  [key: string]: unknown;
}

export interface InitiatePaymentRequest {
  publicKey: string;
  channel: string;
  amount: number;
  transactionId?: string;
  [key: string]: unknown;
}

export interface InitiatePaymentResponse {
  /** Where to POST the next-step authorization payload (OTP, PIN, 3DS fields, etc). */
  actionUrl?: string;
  paymentReference?: string;
  transactionId?: string;
  status?: string;
  [key: string]: unknown;
}

export type AuthorizePayload = Record<string, unknown>;

export interface AuthorizeResponse {
  status?: string;
  requiresValidation?: boolean;
  [key: string]: unknown;
}

export interface ValidatePaymentRequest {
  paymentReference?: string;
  transactionId?: string;
  otp?: string;
  [key: string]: unknown;
}

export interface ValidatePaymentResponse {
  status?: string;
  [key: string]: unknown;
}

export type PaymentStatus = "APPROVED" | "PENDING" | "FAILED" | (string & {});

export interface VerifyPaymentResponse {
  status?: PaymentStatus;
  paymentReference?: string;
  amount?: number | string;
  [key: string]: unknown;
}

export interface Bank {
  code: string;
  name: string;
  currency?: string;
  [key: string]: unknown;
}

export interface BankListResponse {
  banks: Bank[];
  [key: string]: unknown;
}

export interface UssdCode {
  bankCode: string;
  ussdCode: string;
  [key: string]: unknown;
}

export interface UssdCodesResponse {
  codes: UssdCode[];
  [key: string]: unknown;
}

export interface WalletType {
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface WalletTypesResponse {
  wallets: WalletType[];
  [key: string]: unknown;
}

export interface StatusStreamEvent {
  status?: PaymentStatus;
  [key: string]: unknown;
}
