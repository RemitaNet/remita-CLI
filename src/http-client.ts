import { RemitaApiError } from "./types";
import type { ApiErrorPayload } from "./types";

export interface HttpClientOptions {
  baseUrl: string;
  /** Extra headers sent with every request. */
  defaultHeaders?: Record<string, string>;
  /** Override fetch — needed on Node < 18, or useful for testing. */
  fetchImpl?: typeof fetch;
  /** Request timeout in ms. Defaults to 20000. */
  timeoutMs?: number;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.timeoutMs = options.timeoutMs ?? 20000;

    const globalFetch =
      options.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);
    if (!globalFetch) {
      throw new Error(
        "No fetch implementation available. Pass `fetchImpl` explicitly (e.g. from `undici` or `node-fetch`) on Node < 18."
      );
    }
    this.fetchImpl = globalFetch;
  }

  async request<TResponse>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      /** Use instead of baseUrl + path, e.g. for a dynamic processor-provided actionUrl. */
      absoluteUrl?: string;
    } = {}
  ): Promise<TResponse> {
    const url = options.absoluteUrl ?? this.buildUrl(path, options.query);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...this.defaultHeaders,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const text = await response.text();
      const payload = text ? safeJsonParse(text) : undefined;

      if (!response.ok) {
        const errPayload = payload as ApiErrorPayload | undefined;
        throw new RemitaApiError(
          errPayload?.responseMessage ??
            errPayload?.message ??
            `Request to ${url} failed with status ${response.status}`,
          response.status,
          errPayload
        );
      }

      return payload as TResponse;
    } catch (err) {
      if (err instanceof RemitaApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new RemitaApiError(`Request to ${url} timed out after ${this.timeoutMs}ms`, 0);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | undefined>
  ): string {
    const url = new URL(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}
