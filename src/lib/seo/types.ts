// Shared schema.org types. JSON-LD is fundamentally an open graph format —
// builders return a typed alias over `Record<string, unknown>` rather than
// hand-modelling every node on schema.org. Callers consume via `JsonLd`,
// which serialises with `JSON.stringify`, so structural typing is sufficient.

/**
 * A single schema.org node or graph.
 * Always carries `@context` (single nodes) or a `@graph` array.
 */
export type SchemaOrgGraph = Readonly<Record<string, unknown>>;

/**
 * Catalogue-level availability hint. Maps onto schema.org enumerated values
 * under `https://schema.org/`. Drives `Offer.availability`.
 */
export type ProductAvailability = 'InStock' | 'LimitedAvailability' | 'PreOrder' | 'SoldOut';

/**
 * Breadcrumb entry as accepted by `buildBreadcrumbList`.
 * `url` is an absolute URL — relative paths are resolved against `SITE_ORIGIN`
 * by the builder.
 */
export type BreadcrumbItem = {
  readonly name: string;
  readonly url: string;
};
