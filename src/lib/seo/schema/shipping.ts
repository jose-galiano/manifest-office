// `OfferShippingDetails` constants. Two postures shipped today:
//   - free over the threshold (`FREE_SHIP_THRESHOLD`)
//   - flat rate under the threshold (`FLAT_SHIPPING_EUR`)
// Surfaced inside every `Offer` so AI shopping agents and Google's free
// listings pick up shipping cost + delivery time without HTML scraping.

import { FLAT_SHIPPING_EUR, FREE_SHIP_THRESHOLD } from '@/lib/constants/commerce';

import type { SchemaOrgGraph } from '../types';

const EU_AREA = {
  '@type': 'DefinedRegion',
  geoMidpoint: {
    '@type': 'GeoCoordinates',
    addressCountry: 'EU',
  },
} as const;

const TWO_DAY_DELIVERY_WINDOW: SchemaOrgGraph = {
  '@type': 'ShippingDeliveryTime',
  handlingTime: {
    '@type': 'QuantitativeValue',
    minValue: 1,
    maxValue: 2,
    unitCode: 'DAY',
  },
  transitTime: {
    '@type': 'QuantitativeValue',
    minValue: 1,
    maxValue: 2,
    unitCode: 'DAY',
  },
};

/** Free EU shipping above `FREE_SHIP_THRESHOLD`. */
export const SHIPPING_FREE_EU: SchemaOrgGraph = {
  '@type': 'OfferShippingDetails',
  name: 'Free EU shipping',
  shippingDestination: EU_AREA,
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: 0,
    currency: 'EUR',
  },
  doesNotShip: false,
  deliveryTime: TWO_DAY_DELIVERY_WINDOW,
  eligibleTransactionVolume: {
    '@type': 'PriceSpecification',
    minPrice: FREE_SHIP_THRESHOLD,
    priceCurrency: 'EUR',
  },
};

/** Flat-rate EU shipping below the threshold. */
export const SHIPPING_FLAT_EU: SchemaOrgGraph = {
  '@type': 'OfferShippingDetails',
  name: 'Flat-rate EU shipping',
  shippingDestination: EU_AREA,
  shippingRate: {
    '@type': 'MonetaryAmount',
    value: FLAT_SHIPPING_EUR,
    currency: 'EUR',
  },
  doesNotShip: false,
  deliveryTime: TWO_DAY_DELIVERY_WINDOW,
};

export const SHIPPING_DETAILS: ReadonlyArray<SchemaOrgGraph> = [SHIPPING_FREE_EU, SHIPPING_FLAT_EU];
