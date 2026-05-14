// `/api/track` payload + Klaviyo response shapes.

export type KlaviyoEventProperties = Record<string, unknown>;

export type TrackEventRequest = {
  event: string;
  email?: string;
  anonymousId?: string;
  properties?: KlaviyoEventProperties;
};

export type TrackEventResponse = {
  ok: boolean;
  event: string;
  klaviyo_status: number;
  profile_status: number | null;
  identified: boolean;
  detail?: string;
};
