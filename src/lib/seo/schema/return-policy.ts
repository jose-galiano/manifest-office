// `MerchantReturnPolicy` constant. Surfaced inside every `Offer` so agentic
// shopping clients (Google merchant feeds, ChatGPT shopping cards, Apple
// Intelligence) can render the returns posture without scraping prose pages.

import type { SchemaOrgGraph } from '../types';

export const MERCHANT_RETURN_POLICY: SchemaOrgGraph = {
  '@type': 'MerchantReturnPolicy',
  name: '30-day returns to Porto',
  inStoreReturnsOffered: false,
  applicableCountry: 'PT',
  returnPolicyCountry: 'PT',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 30,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnShippingFees',
  returnShippingFeesAmount: {
    '@type': 'MonetaryAmount',
    currency: 'EUR',
    value: 0,
  },
};
