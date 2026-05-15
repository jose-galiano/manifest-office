/**
 * Public barrel for the analytics module.
 *
 * Components and hooks import from `@/lib/analytics`; nothing should reach
 * into the sub-files directly so the surface stays renamable.
 */

export { track } from './track';
export type { TrackOptions } from './track';
export { getAnonymousId, getSessionId } from './identity';
export { CONSENT_DEFAULT_SCRIPT, denyConsent, grantConsent, readStoredConsent } from './consent';
export type { ConsentChoice } from './consent';
export { CUSTOM_EVENTS, ECOMMERCE_EVENTS } from './types';
export type {
  CustomEventName,
  DataLayerEvent,
  EcommerceEventName,
  EcommercePayload,
  EventParams,
  GA4Item,
  KnownEventName,
} from './types';
