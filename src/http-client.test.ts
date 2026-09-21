import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "./http-client";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch;
}

describe("HttpClient", () => {
  it("returns parsed JSON on success", async () => {
    const client = new HttpClient({
      baseUrl: "https://api.example.com/v1",
      fetchImpl: mockFetch(200, { ok: true }),
    });
    const result = await client.request("GET", "/ping");
    expect(result).toEqual({ ok: true });
  });

  it("throws with the response's message and status on failure", async () => {
    const client = new HttpClient({
      baseUrl: "https://api.example.com/v1",
      fetchImpl: mockFetch(400, { responseMessage: "Bad request" }),
    });
    await expect(client.request("GET", "/ping")).rejects.toMatchObject({
      message: "Bad request",
      status: 400,
    });
  });

  it("sends the request body as JSON on POST", async () => {
    const fetchImpl = mockFetch(200, { ok: true });
    const client = new HttpClient({ baseUrl: "https://api.example.com/v1", fetchImpl });
    await client.request("POST", "/pay", { body: { amount: 100 } });

    const [, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.body).toBe(JSON.stringify({ amount: 100 }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("builds URLs from baseUrl + path, with query params", async () => {
    const fetchImpl = mockFetch(200, {});
    const client = new HttpClient({ baseUrl: "https://api.example.com/v1", fetchImpl });
    await client.request("GET", "/verify/ref-1", { query: { publicKey: "abc" } });

    const [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api.example.com/v1/verify/ref-1?publicKey=abc");
  });

  it("uses absoluteUrl verbatim when provided (e.g. a dynamic actionUrl)", async () => {
    const fetchImpl = mockFetch(200, {});
    const client = new HttpClient({ baseUrl: "https://api.example.com/v1", fetchImpl });
    await client.request("POST", "", {
      absoluteUrl: "https://processor.example.com/authorize",
      body: {},
    });

    const [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://processor.example.com/authorize");
  });
});
