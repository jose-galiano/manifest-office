// Typed Klaviyo event / profile payload builders.

import { KLAVIYO_SOURCE_TAG } from '@/lib/constants/klaviyo';
import { klaviyoClient, type KlaviyoCallResult } from '@/lib/klaviyo/client';

import type { KlaviyoEventProperties } from '@/lib/types/klaviyo';

type ProfileAttrs = {
  email?: string;
  anonymous_id?: string;
};

export type SendEventInput = {
  metric: string;
  email?: string;
  anonymousId?: string;
  properties?: KlaviyoEventProperties;
};

export async function sendEvent(input: SendEventInput): Promise<KlaviyoCallResult> {
  const profileAttrs: ProfileAttrs = {};
  if (input.email) {
    profileAttrs.email = input.email;
  }
  if (input.anonymousId) {
    profileAttrs.anonymous_id = input.anonymousId;
  }

  const payload = {
    data: {
      type: 'event',
      attributes: {
        properties: input.properties ?? {},
        metric: { data: { type: 'metric', attributes: { name: input.metric } } },
        profile: { data: { type: 'profile', attributes: profileAttrs } },
        time: new Date().toISOString(),
      },
    },
  };

  return klaviyoClient.postEvent(payload);
}

export type UpsertProfileInput = {
  email: string;
  anonymousId?: string;
  properties?: KlaviyoEventProperties;
};

export async function upsertProfile(input: UpsertProfileInput): Promise<KlaviyoCallResult> {
  type ProfileWriteAttrs = {
    email: string;
    properties: KlaviyoEventProperties;
    anonymous_id?: string;
  };

  const attributes: ProfileWriteAttrs = {
    email: input.email,
    properties: input.properties ?? { source: KLAVIYO_SOURCE_TAG },
  };
  if (input.anonymousId) {
    attributes.anonymous_id = input.anonymousId;
  }

  const payload = {
    data: { type: 'profile', attributes },
  };

  return klaviyoClient.postProfile(payload);
}
