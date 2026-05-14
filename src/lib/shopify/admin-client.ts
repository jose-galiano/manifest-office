// Shared Shopify Admin GraphQL client. Maelify §3: this module exposes ONLY
// a generic execute-a-query function; it never owns a query string of its own.
// Every caller passes its `#graphql` template literal in from a function-local
// scope.

import { SHOPIFY_API_VERSION } from '@/lib/constants/shopify';
import { getEnv } from '@/lib/utils/env';

export type GraphqlVariables = Record<string, unknown>;

export type GraphqlUserError = {
  field?: string[] | null;
  message: string;
};

export type GraphqlResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: unknown };

type ShopifyEnvelope<T> = {
  data?: T;
  errors?: unknown;
};

export async function adminGraphql<T>(
  query: string,
  variables?: GraphqlVariables,
): Promise<GraphqlResult<T>> {
  const store = getEnv('SHOPIFY_STORE');
  const token = getEnv('SHOPIFY_ADMIN_API_TOKEN');

  const response = await fetch(`https://${store}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  // Shopify Admin GraphQL returns 200 + `errors` for query-level failures and
  // 4xx/5xx for transport-level failures. We surface both shapes uniformly.
  if (!response.ok) {
    return { ok: false, status: response.status, errors: await safeText(response) };
  }

  const envelope = (await response.json()) as ShopifyEnvelope<T>;
  if (envelope.errors) {
    return { ok: false, status: response.status, errors: envelope.errors };
  }
  if (typeof envelope.data === 'undefined') {
    return { ok: false, status: response.status, errors: 'empty_response' };
  }
  return { ok: true, data: envelope.data };
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
