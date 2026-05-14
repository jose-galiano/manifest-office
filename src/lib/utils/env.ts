// Type-safe env-var reader. `getEnv` throws if the variable is missing —
// for credentials the app cannot run without (Shopify, Gemini, Klaviyo).
// `getEnvOptional` returns `null` for fail-open paths (Upstash, Turnstile).
//
// Maelify §1 — routes never call `process.env` directly. They go through
// service / vendor wrappers, which go through this helper.

export class MissingEnvError extends Error {
  public readonly variable: string;

  public constructor(variable: string) {
    super(`Missing required environment variable: ${variable}`);
    this.name = 'MissingEnvError';
    this.variable = variable;
  }
}

export function getEnv(name: string): string {
  const value = process.env[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new MissingEnvError(name);
  }
  return value;
}

export function getEnvOptional(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value;
}
