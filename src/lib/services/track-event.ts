// Orchestrates Klaviyo event posting: upserts the profile when an email is
// known, then posts the event itself.

import { KLAVIYO_SOURCE_TAG } from '@/lib/constants/klaviyo';
import { sendEvent, upsertProfile } from '@/lib/klaviyo/events';

import type { KlaviyoEventProperties, TrackEventResponse } from '@/lib/types/klaviyo';

export type TrackEventInput = {
  event: string;
  email?: string;
  anonymousId?: string;
  properties?: KlaviyoEventProperties;
};

export type TrackEventServiceResult =
  | { ok: true; data: TrackEventResponse }
  | { ok: false; status: number; error: string };

export async function trackEvent(input: TrackEventInput): Promise<TrackEventServiceResult> {
  try {
    let profileStatus: number | null = null;
    if (input.email) {
      const profileResult = await upsertProfile({
        email: input.email,
        anonymousId: input.anonymousId,
        properties: { source: KLAVIYO_SOURCE_TAG },
      });
      profileStatus = profileResult.status;
    }

    const eventResult = await sendEvent({
      metric: input.event,
      email: input.email,
      anonymousId: input.anonymousId,
      properties: input.properties,
    });

    const response: TrackEventResponse = {
      ok: eventResult.ok,
      event: input.event,
      klaviyo_status: eventResult.status,
      profile_status: profileStatus,
      identified: Boolean(input.email),
    };
    if (eventResult.detail) {
      response.detail = eventResult.detail;
    }

    return { ok: true, data: response };
  } catch (caught) {
    return {
      ok: false,
      status: 500,
      error: caught instanceof Error ? caught.message : 'track_failed',
    };
  }
}
