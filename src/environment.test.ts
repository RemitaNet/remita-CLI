import { describe, it, expect } from "vitest";
import { resolveEnvironment, ENVIRONMENT_BASE_URLS } from "./environment";

describe("resolveEnvironment", () => {
  it("uses an explicit environment override over detection", () => {
    const result = resolveEnvironment("qa-abc123", { environment: "production" });
    expect(result.environment).toBe("production");
    expect(result.baseUrl).toBe(ENVIRONMENT_BASE_URLS.production);
    expect(result.detected).toBe(true);
  });

  it("detects qa from a qa- prefix", () => {
    const result = resolveEnvironment("qa-abc123");
    expect(result.environment).toBe("qa");
    expect(result.detected).toBe(true);
  });

  it("detects demo from a demo- prefix", () => {
    expect(resolveEnvironment("demo-abc123").environment).toBe("demo");
  });

  it("detects production from a live- prefix", () => {
    expect(resolveEnvironment("live-abc123").environment).toBe("production");
  });

  it("falls back to qa (never production) when the prefix is unrecognized", () => {
    const result = resolveEnvironment("some-unknown-key-format");
    expect(result.environment).toBe("qa");
    expect(result.detected).toBe(false);
  });

  it("respects custom base URL overrides", () => {
    const result = resolveEnvironment("qa-abc123", {
      baseUrls: { qa: "https://custom-qa.example.com/api/v1" },
    });
    expect(result.baseUrl).toBe("https://custom-qa.example.com/api/v1");
  });
});
