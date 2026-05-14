// `/api/config` response. Public-only client config (site keys, never secrets).

export type ClientConfig = {
  turnstile_site_key: string | null;
};
