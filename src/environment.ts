export type RemitaEnvironment = "qa" | "demo" | "production";

export const ENVIRONMENT_BASE_URLS: Record<RemitaEnvironment, string> = {
  qa: "https://api-checkout-qa.systemspecsng.com/api/v1",
  demo: "https://api-checkout-demo.systemspecsng.com/api/v1",
  production: "https://api-checkout.systemspecsng.com/api/v1",
};

/**
 * Best-effort prefix-based environment detection from a public key.
 *
 * IMPORTANT: this is a guess based on common gateway conventions (e.g.
 * Stripe-style `pk_test_` / `pk_live_` prefixes) — it has NOT been verified
 * against Remita's actual key format, because that wasn't available when
 * this was written. Compare a real QA key against a real production key
 * and adjust PREFIX_RULES below to match, or just pass `environment`
 * explicitly to skip detection entirely (recommended until verified).
 */
const PREFIX_RULES: Array<{ pattern: RegExp; environment: RemitaEnvironment }> = [
  { pattern: /^(qa[-_]|pk_qa_)/i, environment: "qa" },
  { pattern: /^(demo[-_]|pk_demo_|pk_test_)/i, environment: "demo" },
  { pattern: /^(live[-_]|pk_live_|prod[-_])/i, environment: "production" },
];

export interface ResolveEnvironmentOptions {
  /** Explicit override — always wins over prefix detection. */
  environment?: RemitaEnvironment;
  /** Custom base URLs, e.g. to point at a local/staging mirror. */
  baseUrls?: Partial<Record<RemitaEnvironment, string>>;
}

export interface ResolvedEnvironment {
  environment: RemitaEnvironment;
  baseUrl: string;
  /** False when detection couldn't confidently match a prefix and we fell back to a default. */
  detected: boolean;
}

/**
 * Resolves which environment (and base URL) to use for a given public key.
 *
 * Never silently resolves to "production" purely from prefix detection —
 * if the key doesn't match a known pattern, this falls back to "qa" and
 * marks `detected: false` so callers can warn/log instead of risking a
 * misrouted live transaction.
 */
export function resolveEnvironment(
  publicKey: string,
  options: ResolveEnvironmentOptions = {}
): ResolvedEnvironment {
  const baseUrls = { ...ENVIRONMENT_BASE_URLS, ...options.baseUrls };

  if (options.environment) {
    return {
      environment: options.environment,
      baseUrl: baseUrls[options.environment],
      detected: true,
    };
  }

  for (const rule of PREFIX_RULES) {
    if (rule.pattern.test(publicKey)) {
      return {
        environment: rule.environment,
        baseUrl: baseUrls[rule.environment],
        detected: true,
      };
    }
  }

  return { environment: "qa", baseUrl: baseUrls.qa, detected: false };
}
