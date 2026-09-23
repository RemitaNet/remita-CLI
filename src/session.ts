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

  /** URL returned by initiate() for the *authorize* step. */
  private authorizeActionUrl?: string;
  /** URL returned by authorize() for the *validate* step, if different. */
  private validateActionUrl?: string;

  constructor(private readonly client: RemitaCheckoutClient) {}

  async pre(request: PrePaymentRequest): Promise<PrePaymentResponse> {
    const response = await this.client.prePayment(request);
    // Read refs from the RESPONSE, not the request.
    this.transactionId = response.transactionId ?? this.transactionId;
    this.paymentReference = response.paymentReference ?? this.paymentReference;
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
    this.authorizeActionUrl = response.actionUrl;
    this.validateActionUrl = undefined; // reset until authorize tells us otherwise
    this.paymentReference = response.paymentReference ?? this.paymentReference;
    this.transactionId = response.transactionId ?? this.transactionId;
    this.stage = "initiated";
    return response;
  }

  /**
   * Uses the actionUrl captured from initiate() unless you pass one explicitly.
   * Pass `contentType` for 3DS processor endpoints that require form-encoding.
   */
  async authorize(
    payload: AuthorizePayload,
    actionUrlOverride?: string,
    contentType?: string
  ): Promise<AuthorizeResponse> {
    const url = actionUrlOverride ?? this.authorizeActionUrl;
    if (!url) {
      throw new Error(
        "No actionUrl available — call initiate() first, or pass actionUrlOverride explicitly."
      );
    }
    const response = await this.client.authorize(url, payload, contentType);

    // If the processor told us where the next validation step lives, use it.
    const next = (response as { actionUrl?: string }).actionUrl;
    if (next) this.validateActionUrl = next;

    this.stage = "authorized";
    return response;
  }

  async validate(
    request: ValidatePaymentRequest,
    actionUrlOverride?: string
  ): Promise<ValidatePaymentResponse> {
    // Prefer an explicit override, then the URL authorize() handed us,
    // then fall through to /payment/validate.
    const url = actionUrlOverride ?? this.validateActionUrl;
    const response = await this.client.validatePayment(request, url);
    this.stage = "validated";
    return response;
  }

  async verify(paymentRefOverride?: string): Promise<VerifyPaymentResponse> {
    const ref = paymentRefOverride ?? this.paymentReference ?? this.transactionId;
    if (!ref) {
      throw new Error(
        "No paymentReference or transactionId available — call initiate() first, or pass it explicitly."
      );
    }
    const response = await this.client.verifyPayment(ref);
    // Only APPROVED counts as verified. PENDING stays "validated".
    if (response.status === "APPROVED") {
      this.stage = "verified";
    } else if (response.status === "FAILED") {
      this.stage = "failed";
    }
    return response;
  }
}