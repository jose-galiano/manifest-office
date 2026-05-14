// Generic API response envelopes. Discriminated unions so consumers must check
// `ok` before reaching for `data` / `error`.

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: string; reason?: string };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
