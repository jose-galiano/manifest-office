// schema.org `Organization` node for Manifest Office. Mounted once in
// `src/app/layout.tsx` so every page in the site advertises the brand graph.

import {
  BRAND_DESCRIPTION,
  BRAND_FOUNDING_DATE,
  BRAND_LEGAL_NAME,
  BRAND_LOGO_URL,
  BRAND_NAME,
  BRAND_SAME_AS,
  CONTACT_EMAIL,
  PORTO_ADDRESS,
  SITE_ORIGIN,
} from '../constants';

import type { SchemaOrgGraph } from '../types';

export function buildOrganizationSchema(): SchemaOrgGraph {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: BRAND_NAME,
    legalName: BRAND_LEGAL_NAME,
    url: SITE_ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: BRAND_LOGO_URL,
    },
    description: BRAND_DESCRIPTION,
    foundingDate: BRAND_FOUNDING_DATE,
    sameAs: BRAND_SAME_AS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT_EMAIL,
        areaServed: 'EU',
        availableLanguage: ['English', 'Portuguese', 'Spanish'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      ...PORTO_ADDRESS,
    },
  };
}
