export interface StatusStreamOptions {
  onMessage: (event: { data: unknown; raw: string }) => void;
  onError?: (err: unknown) => void;
  onOpen?: () => void;
  fetchImpl?: typeof fetch;
  /** Optional override; publicKey is sent as a query param by default. */
  sendPublicKeyHeader?: boolean;
}

export interface StatusStreamHandle {
  close: () => void;
}

/**
 * Opens the payment status SSE stream using a manual fetch + ReadableStream
 * reader rather than the browser-only `EventSource` global, so this works
 * identically in the browser and in Node 18+.
 */
export function openStatusStream(
  baseUrl: string,
  trxRef: string,
  publicKey: string,
  options: StatusStreamOptions
): StatusStreamHandle {
  const fetchImpl =
    options.fetchImpl ?? (typeof fetch !== "undefined" ? fetch : undefined);
  if (!fetchImpl) {
    throw new Error("No fetch implementation available for streamPaymentStatus.");
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/payment/status/stream/${encodeURIComponent(
    trxRef
  )}?publicKey=${encodeURIComponent(publicKey)}`;

  const headers: Record<string, string> = { Accept: "text/event-stream" };
  if (options.sendPublicKeyHeader) {
    headers.publicKey = publicKey;
  }

  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetchImpl(url, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Status stream request failed with status ${response.status}`);
      }

      options.onOpen?.();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const dataLines = rawEvent
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim());

          if (dataLines.length === 0) continue;

          const raw = dataLines.join("\n");
          let data: unknown = raw;
          try {
            data = JSON.parse(raw);
          } catch {
            // not JSON — leave as the raw string
          }

          options.onMessage({ data, raw });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      options.onError?.(err);
    }
  })();

  return {
    close: () => controller.abort(),
  };
}