import { describe, it, expect, vi } from "vitest";
import { RemitaCheckoutClient } from "./client";

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch;
}

describe("RemitaCheckoutClient", () => {
  it("resolves the qa environment from the key prefix and hits the qa base URL", async () => {
    const fetchImpl = mockFetch({ merchantName: "Acme" });
    const client = new RemitaCheckoutClient({ publicKey: "qa-abc123", fetchImpl });

    await client.prePayment({ publicKey: client.publicKey, rrr: "RRR1" });

    const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://api-checkout-qa.systemspecsng.com/api/v1/payment/pre");
    expect(init.method).toBe("POST");
  });

  it("calls GET /payment/verify/:ref for verifyPayment", async () => {
    const fetchImpl = mockFetch({ status: "APPROVED" });
    const client = new RemitaCheckoutClient({
      publicKey: "qa-abc123",
      environment: "qa",
      fetchImpl,
    });

    const result = await client.verifyPayment("PAY-REF-1");

    expect(result.status).toBe("APPROVED");
    const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/payment/verify/PAY-REF-1");
    expect(init.method).toBe("GET");
  });

  it("posts to the dynamic actionUrl (not the base URL) for authorize()", async () => {
    const fetchImpl = mockFetch({ status: "OK" });
    const client = new RemitaCheckoutClient({
      publicKey: "qa-abc123",
      environment: "qa",
      fetchImpl,
    });

    await client.authorize("https://processor.example.com/step2", { otp: "123456" });

    const [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://processor.example.com/step2");
  });

  it("falls back to /payment/validate when no actionUrl is given, and to the actionUrl when one is", async () => {
    const fetchImpl = mockFetch({ status: "OK" });
    const client = new RemitaCheckoutClient({
      publicKey: "qa-abc123",
      environment: "qa",
      fetchImpl,
    });

    await client.validatePayment({ otp: "111111" });
    let [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/payment/validate");

    await client.validatePayment({ otp: "111111" }, "https://processor.example.com/validate-step");
    [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(url).toBe("https://processor.example.com/validate-step");
  });

  it("warns via onEnvironmentDetectionFallback when the key prefix is unrecognized", () => {
    const fetchImpl = mockFetch({});
    const onFallback = vi.fn();
    new RemitaCheckoutClient({
      publicKey: "totally-unrecognized-format",
      fetchImpl,
      onEnvironmentDetectionFallback: onFallback,
    });
    expect(onFallback).toHaveBeenCalledWith("qa");
  });
});
