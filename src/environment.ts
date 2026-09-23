export type RemitaEnvironment = "qa" | "demo" | "production";

export const ENVIRONMENT_BASE_URLS: Record<RemitaEnvironment, string> = {
  qa: "https://api-checkout-qa.systemspecsng.com/api/v1",
  demo: "https://api-checkout-demo.systemspecsng.com/api/v1",
  production: "https://api-checkout.systemspecsng.com/api/v1",
};

/**
 * Best-effort prefix-based environment detection from a public key.
 *
 * IMPORTANT: `pk_live_` is deliberately NOT mapped here. Remita's real key
 * format has not been verified, and silently routing a key to production
 * is worse than failing loudly. Callers who want production MUST pass
 * `environment: "production"` (or `--env production` on the CLI) explicitly.
 */
const PREFIX_RULES: Array<{ pattern: RegExp; environment: RemitaEnvironment }> = [
  { pattern: /^(qa[-_]|pk_qa_)/i, environment: "qa" },
  { pattern: /^(demo[-_]|pk_demo_|pk_test_)/i, environment: "demo" },
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