import { describe, it, expect, vi } from "vitest";
import { openStatusStream } from "./stream";

function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  return { ok: true, status: 200, body } as unknown as Response;
}

describe("openStatusStream", () => {
  it("parses SSE 'data:' lines as JSON when possible", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        sseResponse([`data: {"status":"PENDING"}\n\n`, `data: {"status":"APPROVED"}\n\n`])
      ) as unknown as typeof fetch;

    const received: unknown[] = [];
    await new Promise<void>((resolve) => {
      openStatusStream("https://api.example.com/v1", "TRX-1", "pk-1", {
        fetchImpl,
        onMessage: (event) => {
          received.push(event.data);
          if (received.length === 2) resolve();
        },
      });
    });

    expect(received).toEqual([{ status: "PENDING" }, { status: "APPROVED" }]);
  });

  it("falls back to the raw string when a data line isn't valid JSON", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(sseResponse([`data: not-json\n\n`])) as unknown as typeof fetch;

    const received: unknown[] = [];
    await new Promise<void>((resolve) => {
      openStatusStream("https://api.example.com/v1", "TRX-1", "pk-1", {
        fetchImpl,
        onMessage: (event) => {
          received.push(event.data);
          resolve();
        },
      });
    });

    expect(received).toEqual(["not-json"]);
  });

  it("builds the stream URL with trxRef and publicKey", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(sseResponse([])) as unknown as typeof fetch;
    openStatusStream("https://api.example.com/v1", "TRX-1", "pk-1", {
      fetchImpl,
      onMessage: () => {},
    });
    await new Promise((r) => setTimeout(r, 0));

    const [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.example.com/v1/payment/status/stream/TRX-1?publicKey=pk-1");
  });
});
