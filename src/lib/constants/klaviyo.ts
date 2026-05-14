// Klaviyo Client API constants. The Client API takes the public company id
// in the query-string and needs no auth header — designed for browser /
// serverless event tracking. We use it deliberately to bypass the missing
// `events:write` scope on the private key.

export const KLAVIYO_REVISION = '2024-10-15';
export const KLAVIYO_CLIENT_BASE = 'https://a.klaviyo.com/client';
export const KLAVIYO_SOURCE_TAG = 'manifest-office-demo';
