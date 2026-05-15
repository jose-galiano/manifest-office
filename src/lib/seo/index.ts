// Barrel for the SEO surface. Pages import `buildXSchema` + `JsonLd` from
// here so the schema directory layout can evolve without touching consumers.

export { JsonLd } from './JsonLd';

export { buildOrganizationSchema } from './schema/organization';
export { buildWebsiteSchema } from './schema/website';
export { buildBreadcrumbList } from './schema/breadcrumb';
export { buildProductSchema, type ProductSchemaOptions } from './schema/product';
export { buildOfferCatalog } from './schema/offer-catalog';
export { MERCHANT_RETURN_POLICY } from './schema/return-policy';
export { SHIPPING_DETAILS, SHIPPING_FREE_EU, SHIPPING_FLAT_EU } from './schema/shipping';

export { SITE_ORIGIN, BRAND_NAME } from './constants';

export type { SchemaOrgGraph, BreadcrumbItem, ProductAvailability } from './types';
