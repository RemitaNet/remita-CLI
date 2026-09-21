import type { RemitaCheckoutClient } from "./client";
import type {
  PrePaymentRequest,
  PrePaymentResponse,
  FeeChargeRequest,
  FeeChargeResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  AuthorizePayload,
  AuthorizeResponse,
  ValidatePaymentRequest,
  ValidatePaymentResponse,
  VerifyPaymentResponse,
} from "./types";

export type PaymentSessionStage =
  | "idle"
  | "pre"
  | "fee"
  | "initiated"
  | "authorized"
  | "validated"
  | "verified"
  | "failed";

/**
 * Sequences the multi-step payment flow (pre → fee → initiate → authorize →
 * validate → verify) and tracks the refs each step hands to the next
 * (paymentReference, transactionId, actionUrl), so callers don't have to
 * thread that state through by hand.
 */
export class PaymentSession {
  stage: PaymentSessionStage = "idle";
  paymentReference?: string;
  transactionId?: string;
  private actionUrl?: string;

  constructor(private readonly client: RemitaCheckoutClient) {}

  async pre(request: PrePaymentRequest): Promise<PrePaymentResponse> {
    const response = await this.client.prePayment(request);
    this.transactionId = request.transactionId ?? this.transactionId;
    this.stage = "pre";
    return response;
  }

  async fee(request: FeeChargeRequest): Promise<FeeChargeResponse> {
    const response = await this.client.calculateFee(request);
    this.stage = "fee";
    return response;
  }

  async initiate(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    const response = await this.client.initiatePayment(request);
    this.actionUrl = response.actionUrl;
    this.paymentReference = response.paymentReference ?? this.paymentReference;
    this.transactionId = response.transactionId ?? this.transactionId;
    this.stage = "initiated";
    return response;
  }

  /** Uses the actionUrl captured from initiate() unless you pass one explicitly. */
  async authorize(
    payload: AuthorizePayload,
    actionUrlOverride?: string
  ): Promise<AuthorizeResponse> {
    const url = actionUrlOverride ?? this.actionUrl;
    if (!url) {
      throw new Error(
        "No actionUrl available — call initiate() first, or pass actionUrlOverride explicitly."
      );
    }
    const response = await this.client.authorize(url, payload);
    this.stage = "authorized";
    return response;
  }

  async validate(
    request: ValidatePaymentRequest,
    actionUrlOverride?: string
  ): Promise<ValidatePaymentResponse> {
    const response = await this.client.validatePayment(request, actionUrlOverride ?? this.actionUrl);
    this.stage = "validated";
    return response;
  }

  async verify(paymentRefOverride?: string): Promise<VerifyPaymentResponse> {
    const ref = paymentRefOverride ?? this.paymentReference;
    if (!ref) {
      throw new Error("No paymentReference available — call initiate() first, or pass it explicitly.");
    }
    const response = await this.client.verifyPayment(ref);
    this.stage = response.status === "FAILED" ? "failed" : "verified";
    return response;
  }
}
