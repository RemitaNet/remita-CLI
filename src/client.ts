import { HttpClient } from "./http-client";
import { resolveEnvironment } from "./environment";
import type { ResolveEnvironmentOptions } from "./environment";
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
  BankListResponse,
  UssdCodesResponse,
  WalletTypesResponse,
} from "./types";
import { openStatusStream } from "./stream";
import type { StatusStreamHandle, StatusStreamOptions } from "./stream";

export interface RemitaCheckoutClientOptions extends ResolveEnvironmentOptions {
  publicKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Extra headers merged after `publicKey` is set (so they can override). */
  defaultHeaders?: Record<string, string>;
  /** Called once if the environment couldn't be confidently detected from the key prefix (falls back to "qa"). */
  onEnvironmentDetectionFallback?: (guessed: "qa") => void;
}

export class RemitaCheckoutClient {
  readonly publicKey: string;
  readonly environment: string;
  readonly baseUrl: string;
  private readonly http: HttpClient;

  constructor(options: RemitaCheckoutClientOptions) {
    this.publicKey = options.publicKey;

    const resolved = resolveEnvironment(options.publicKey, {
      environment: options.environment,
      baseUrls: options.baseUrls,
    });

    if (!resolved.detected) {
      options.onEnvironmentDetectionFallback?.("qa");
    }

    this.environment = resolved.environment;
    this.baseUrl = resolved.baseUrl;

    this.http = new HttpClient({
      baseUrl: resolved.baseUrl,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      defaultHeaders: {
        // publicKey is required as a header on every checkout API call.
        publicKey: options.publicKey,
        ...options.defaultHeaders,
      },
    });
  }

  // --- Core payment lifecycle ---------------------------------------------

  prePayment(request: PrePaymentRequest): Promise<PrePaymentResponse> {
    return this.http.request("POST", "/payment/pre", { body: request });
  }

  calculateFee(request: FeeChargeRequest): Promise<FeeChargeResponse> {
    return this.http.request("POST", "/payment/pre/feeCharge", { body: request });
  }

  initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    return this.http.request("POST", "/payment/initiate", { body: request });
  }

  /**
   * Posts authorization params (OTP, PIN, 3DS form fields, etc) to the
   * processor-provided actionUrl from initiatePayment().
   *
   * NOTE: CyberSource/Cardinal 3DS endpoints expect
   * `application/x-www-form-urlencoded`. Pass `contentType` if the
   * actionUrl is a 3DS processor endpoint.
   */
  authorize(
    actionUrl: string,
    payload: AuthorizePayload,
    contentType?: string
  ): Promise<AuthorizeResponse> {
    void contentType;
    return this.http.request("POST", "", {
      body: payload,
      absoluteUrl: actionUrl,
    });
  }

  /**
   * Validates second-factor authorization (e.g. OTP). Per the endpoint docs
   * this may go to a fixed /payment/validate endpoint OR to a dynamic
   * actionUrl — pass `actionUrl` if the preceding step returned one.
   */
  validatePayment(
    request: ValidatePaymentRequest,
    actionUrl?: string
  ): Promise<ValidatePaymentResponse> {
    return actionUrl
      ? this.http.request("POST", "", { body: request, absoluteUrl: actionUrl })
      : this.http.request("POST", "/payment/validate", { body: request });
  }

  verifyPayment(paymentRef: string): Promise<VerifyPaymentResponse> {
    return this.http.request("GET", `/payment/verify/${encodeURIComponent(paymentRef)}`);
  }

  /** Opens an SSE stream for real-time status updates. Call the returned `close()` when done. */
  streamPaymentStatus(trxRef: string, options: StatusStreamOptions): StatusStreamHandle {
    return openStatusStream(this.baseUrl, trxRef, this.publicKey, options);
  }

  // --- Channel data / configuration ---------------------------------------

  getBankList(): Promise<BankListResponse> {
    return this.http.request("GET", "/payment/bank-list");
  }

  getUssdCodes(): Promise<UssdCodesResponse> {
    return this.http.request("GET", "/misc/ussd-codes");
  }

  getWalletTypes(): Promise<WalletTypesResponse> {
    return this.http.request("GET", "/misc/wallet-type");
  }
}