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
 * Field names for PrePaymentRequest are verified against a working QA
 * cURL. The rest remain best-effort based on standard gateway
 * conventions and should be tightened as real DTOs are confirmed.
 *
 * `publicKey` is NEVER part of a request body — it is sent as a header
 * by RemitaCheckoutClient. Do not add it back to any request interface.
 * -------------------------------------------------------------------- */

export interface PrePaymentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  paymentIdentifier: string;
  currency: string;
  narration?: string;
  amount: number;
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
  /** Forwarded from /payment/pre if the API echoes one. */
  transactionId?: string;
  paymentReference?: string;
  [key: string]: unknown;
}

export interface FeeChargeRequest {
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