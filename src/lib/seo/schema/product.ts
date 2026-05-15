// `Product` JSON-LD builder. Mounted on every PDP and emitted inside
// `OfferCatalog` on collection pages. The graph carries the offer, return
// policy, shipping posture, brand, additional material/volume/origin
// properties, and accessory/variant relationships across the system.

import {
  COLLECTIONS,
  EDITION_01,
  EDITION_01_PRODUCTS,
  findProductByShopifyHandle,
} from '@/content/manifest-office';

import {
  BRAND_NAME,
  DEFAULT_PRICE_CURRENCY,
  EDITION_01_CLOSE_DATE,
  PRODUCT_CATEGORY_DEFAULT,
  PRODUCT_CATEGORY_HARDWARE,
  SITE_ORIGIN,
} from '../constants';

import { MERCHANT_RETURN_POLICY } from './return-policy';
import { SHIPPING_DETAILS } from './shipping';

import type { ProductAvailability, SchemaOrgGraph } from '../types';
import type { ManifestProduct } from '@/lib/types/product';

export type ProductSchemaOptions = {
  readonly availability?: ProductAvailability;
};

const HARDWARE_HANDLES: ReadonlySet<string> = new Set(['anchor-latch', 'luggage-tag']);
const CUBE_HANDLES: readonly string[] = ['cube-s', 'cube-m', 'cube-l'];
const POUCH_HANDLES: readonly string[] = ['tech-pouch-s', 'tech-pouch-m', 'tech-pouch-l'];

const SIZE_VARIANT_FAMILIES: ReadonlyArray<{
  readonly familyId: string;
  readonly familyName: string;
  readonly handles: readonly string[];
}> = [
  { familyId: 'cubes', familyName: 'Cubes', handles: CUBE_HANDLES },
  { familyId: 'pouches', familyName: 'Tech Pouches', handles: POUCH_HANDLES },
];

function storefrontHandle(product: ManifestProduct): string {
  // `ManifestProduct.handle` carries the Shopify handle (with `manifest-`
  // prefix). The catalogue lookup unwinds to the storefront handle.
  return findProductByShopifyHandle(product.handle)?.handle ?? product.handle;
}

function productUrl(product: ManifestProduct): string {
  return `${SITE_ORIGIN}/products/${storefrontHandle(product)}`;
}

function productIri(product: ManifestProduct): string {
  return `${productUrl(product)}#product`;
}

function deriveAvailability(product: ManifestProduct): ProductAvailability {
  const total = product.editionTotal || EDITION_01.totalAllocation;
  if (total <= 0) {
    return 'InStock';
  }
  const ratio = product.editionIssued / total;
  if (ratio >= 1) {
    return 'SoldOut';
  }
  if (ratio >= 0.8) {
    return 'LimitedAvailability';
  }
  return 'InStock';
}

function buildAdditionalProperties(product: ManifestProduct): SchemaOrgGraph[] {
  const properties: SchemaOrgGraph[] = [
    { '@type': 'PropertyValue', name: 'Material', value: '420D Cordura' },
    { '@type': 'PropertyValue', name: 'Origin', value: 'Porto, Portugal' },
    { '@type': 'PropertyValue', name: 'Closure', value: 'Anchor Latch MO-A1' },
    { '@type': 'PropertyValue', name: 'Edition', value: `${EDITION_01.number} — Gibraltar` },
  ];
  if (product.volume && product.volume !== '—') {
    properties.push({ '@type': 'PropertyValue', name: 'Volume', value: product.volume });
  }
  return properties;
}

function buildIsAccessoryOrSparePartFor(handle: string): SchemaOrgGraph[] | undefined {
  // The Anchor Latch is the spare-hardware SKU. Schema.org expects an
  // inverse relationship from the spare to every host product.
  if (handle !== 'anchor-latch') {
    return undefined;
  }
  return EDITION_01_PRODUCTS.filter((entry) => !HARDWARE_HANDLES.has(entry.handle)).map(
    (entry) => ({
      '@type': 'Product',
      '@id': `${SITE_ORIGIN}/products/${entry.handle}#product`,
      name: entry.title,
      url: `${SITE_ORIGIN}/products/${entry.handle}`,
    }),
  );
}

function buildIsVariantOf(handle: string): SchemaOrgGraph | undefined {
  const family = SIZE_VARIANT_FAMILIES.find((entry) => entry.handles.includes(handle));
  if (!family) {
    return undefined;
  }
  // `ProductGroup` is the schema.org primitive for "this SKU is one size of a
  // size-variant family". We link to the collection that holds the family.
  return {
    '@type': 'ProductGroup',
    '@id': `${SITE_ORIGIN}/collections/${family.familyId}#productgroup`,
    name: family.familyName,
    url: `${SITE_ORIGIN}/collections/${family.familyId}`,
    productGroupID: family.familyId,
    variesBy: ['https://schema.org/size'],
  };
}

function pickCategory(handle: string): string {
  return HARDWARE_HANDLES.has(handle) ? PRODUCT_CATEGORY_HARDWARE : PRODUCT_CATEGORY_DEFAULT;
}

function categoriesForProduct(handle: string): readonly string[] {
  // A product can sit in multiple collections (e.g. cube-s sits in
  // edition-01, all, cubes). Listing them all helps agents understand the
  // catalogue structure.
  const slugs: string[] = [];
  for (const collection of COLLECTIONS) {
    if (collection.productHandles.includes(handle)) {
      slugs.push(collection.handle);
    }
  }
  return slugs;
}

function buildOffer(product: ManifestProduct, availability: ProductAvailability): SchemaOrgGraph {
  const offerUrl = productUrl(product);
  const currency = product.currency || DEFAULT_PRICE_CURRENCY;
  return {
    '@type': 'Offer',
    '@id': `${offerUrl}#offer`,
    url: offerUrl,
    price: product.price,
    priceCurrency: currency,
    priceValidUntil: EDITION_01_CLOSE_DATE,
    availability: `https://schema.org/${availability}`,
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${SITE_ORIGIN}/#organization` },
    hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
    shippingDetails: SHIPPING_DETAILS,
  };
}

export function buildProductSchema(
  product: ManifestProduct,
  options: ProductSchemaOptions = {},
): SchemaOrgGraph {
  const handle = storefrontHandle(product);
  const availability = options.availability ?? deriveAvailability(product);
  const images = product.images.length > 0 ? product.images.map((entry) => entry.url) : undefined;
  const productCategories = categoriesForProduct(handle);
  const accessoryFor = buildIsAccessoryOrSparePartFor(handle);
  const variantOf = buildIsVariantOf(handle);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productIri(product),
    name: product.title,
    description: `${product.title} — ${BRAND_NAME} Edition ${EDITION_01.number}. ${product.volume && product.volume !== '—' ? `${product.volume} capacity. ` : ''}Finished in Porto.`,
    sku: product.sku || handle,
    mpn: product.sku || handle.toUpperCase(),
    url: productUrl(product),
    category: pickCategory(handle),
    brand: { '@type': 'Brand', name: BRAND_NAME, '@id': `${SITE_ORIGIN}/#organization` },
    manufacturer: { '@id': `${SITE_ORIGIN}/#organization` },
    additionalProperty: buildAdditionalProperties(product),
    offers: buildOffer(product, availability),
  };

  if (images) {
    schema.image = images;
  } else if (product.image) {
    schema.image = [product.image];
  }

  if (productCategories.length > 0) {
    schema.keywords = productCategories.join(', ');
  }

  if (accessoryFor && accessoryFor.length > 0) {
    schema.isAccessoryOrSparePartFor = accessoryFor;
  }

  if (variantOf) {
    schema.isVariantOf = variantOf;
  }

  return schema as SchemaOrgGraph;
}
