export interface HttpRequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  absoluteUrl?: string;
  /** Overrides the default application/json for a single request. */
  contentType?: string;
}

export interface HttpClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
}

export interface ApiErrorPayload {
  responseMessage?: string;
  message?: string;
  [key: string]: unknown;
}

export class RemitaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: ApiErrorPayload
  ) {
    super(message);
    this.name = "RemitaApiError";
  }
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl =
      options.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : (undefined as never));
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.defaultHeaders = options.defaultHeaders ?? {};

    if (!this.fetchImpl) {
      throw new Error("No fetch implementation available for HttpClient.");
    }
  }

  async request<T>(
    method: string,
    path: string,
    opts: HttpRequestOptions = {}
  ): Promise<T> {
    // --- L6 fix: join WITHOUT dropping /api/v1 ---
    // path is expected to start with "/" and the baseUrl already ends with
    // "/api/v1", so plain concatenation is correct. Do NOT use `new URL(path, base)`.
    const url = opts.absoluteUrl
      ? opts.absoluteUrl
      : `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.defaultHeaders,
      ...opts.headers,
    };

    let body: BodyInit | undefined;
    if (opts.body !== undefined) {
      if (opts.contentType === "application/x-www-form-urlencoded") {
        headers["Content-Type"] = opts.contentType;
        body = new URLSearchParams(
          Object.entries(opts.body as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v),
          ])
        ).toString();
      } else {
        headers["Content-Type"] = opts.contentType ?? "application/json";
        body = JSON.stringify(opts.body);
      }
    }

    const controller = new AbortController();
    const timer =
      this.timeoutMs > 0 ? setTimeout(() => controller.abort(), this.timeoutMs) : undefined;

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        // leave as raw string
      }

      if (!response.ok) {
        const payload = (parsed ?? {}) as ApiErrorPayload;
        const message =
          payload.responseMessage ??
          payload.message ??
          `Request failed with status ${response.status}`;
        throw new RemitaApiError(message, response.status, payload);
      }

      return parsed as T;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}