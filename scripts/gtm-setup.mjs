#!/usr/bin/env node
// One-shot GTM bootstrap for `GTM-5HMML5DX` (the demo.maelify.com container).
//
// Creates / completes:
//   - 18 Data Layer Variables (skips ones already created in the UI).
//   - 1 Custom Event trigger matching every Manifest Office event.
//   - 1 GA4 Event tag that forwards all of them to `G-S63PX9NHSS`.
//
// Idempotent: each step lists existing items first and skips by name match.
// You can re-run safely after partial failures.
//
// AUTH (one of):
//   - Set `GTM_TOKEN` to a Tag Manager OAuth access token. Easiest source:
//     https://developers.google.com/oauthplayground/
//       Step 1 → paste the scope:
//         https://www.googleapis.com/auth/tagmanager.edit.containers
//       Authorize APIs → sign in → "Exchange authorization code for tokens"
//       Copy `access_token`, run:  GTM_TOKEN=ya29.xxx node scripts/gtm-setup.mjs
//   - OR have `gcloud` installed + run `gcloud auth application-default login
//     --scopes=https://www.googleapis.com/auth/tagmanager.edit.containers`,
//     then run without GTM_TOKEN. The script falls back to gcloud.
//
// Optional env vars (auto-discovered from publicId `GTM-5HMML5DX` if absent):
//   GTM_ACCOUNT_ID, GTM_CONTAINER_ID, GTM_WORKSPACE_ID,
//   GA4_MEASUREMENT_ID (default: G-S63PX9NHSS).

import { execSync } from 'node:child_process';

const PUBLIC_CONTAINER_ID = 'GTM-5HMML5DX';
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID ?? 'G-S63PX9NHSS';

const DLV_KEYS = [
  'session_id',
  'anonymous_id',
  'page_path',
  'label',
  'section_name',
  'depth_pct',
  'handle',
  'title',
  'price',
  'colorway',
  'panel_index',
  'source',
  'duration_ms',
  'distance_px',
  'destination_host',
  'selector',
  'step',
  'option',
];

const EVENT_REGEX = [
  'page_view',
  'section_view',
  'section_dwell',
  'scroll_depth',
  'element_click',
  'outbound_click',
  'rage_click',
  'dead_click',
  'reserve_click',
  'viewer_3d_rotate',
  'viewer_3d_explode',
  'viewer_3d_assemble',
  'scroll_pin_panel',
  'cart_drawer_open',
  'cart_drawer_close',
  'audio_play',
  'audio_pause',
  'manifest_complete',
  'checkout_view',
  'checkout_express_click',
  'book_call',
  'call_booked_confirmation_view',
  'variant_view',
  'email_capture_submit',
  'consent_granted',
  'consent_denied',
  'view_item',
  'view_item_list',
  'select_item',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'generate_lead',
  'teletype_complete',
  'dossier_filter',
].join('|');

function resolveToken() {
  if (process.env.GTM_TOKEN) return process.env.GTM_TOKEN.trim();
  try {
    return execSync('gcloud auth application-default print-access-token', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    console.error('No GTM_TOKEN env var and no gcloud token available.');
    console.error('Get a token from https://developers.google.com/oauthplayground/');
    console.error('Scope: https://www.googleapis.com/auth/tagmanager.edit.containers');
    process.exit(1);
  }
}

const TOKEN = resolveToken();
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function api(path, init = {}) {
  const url = `https://www.googleapis.com/tagmanager/v2${path}`;
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) {
    console.error(`API ${res.status} ${init.method ?? 'GET'} ${path}\n${text}`);
    process.exit(1);
  }
  return text ? JSON.parse(text) : {};
}

async function discoverIds() {
  let accountId = process.env.GTM_ACCOUNT_ID;
  let containerId = process.env.GTM_CONTAINER_ID;
  let workspaceId = process.env.GTM_WORKSPACE_ID;

  if (!accountId || !containerId) {
    console.log('Discovering account / container by publicId...');
    const accounts = await api('/accounts');
    for (const acc of accounts.account ?? []) {
      const containers = await api(`/accounts/${acc.accountId}/containers`);
      const match = (containers.container ?? []).find(
        (container) => container.publicId === PUBLIC_CONTAINER_ID,
      );
      if (match) {
        accountId = acc.accountId;
        containerId = match.containerId;
        break;
      }
    }
    if (!accountId) {
      console.error(
        `Container ${PUBLIC_CONTAINER_ID} not found in any account this token can see.`,
      );
      process.exit(1);
    }
  }

  if (!workspaceId) {
    const workspaces = await api(`/accounts/${accountId}/containers/${containerId}/workspaces`);
    workspaceId = (workspaces.workspace ?? [])[0]?.workspaceId;
    if (!workspaceId) {
      console.error('No workspace found. Open the container in the UI first.');
      process.exit(1);
    }
  }

  return { accountId, containerId, workspaceId };
}

async function main() {
  const { accountId, containerId, workspaceId } = await discoverIds();
  const base = `/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`;
  console.log(
    `Workspace: accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`,
  );

  // --- Data Layer Variables ---
  const existingVarsResp = await api(`${base}/variables`);
  const existingVarNames = new Set(
    (existingVarsResp.variable ?? []).map((variable) => variable.name),
  );
  for (const key of DLV_KEYS) {
    const name = `DLV - ${key}`;
    if (existingVarNames.has(name)) {
      console.log(`var  SKIP   ${name}`);
      continue;
    }
    await api(`${base}/variables`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        type: 'v',
        parameter: [
          { type: 'integer', key: 'dataLayerVersion', value: '2' },
          { type: 'boolean', key: 'setDefaultValue', value: 'false' },
          { type: 'template', key: 'name', value: key },
        ],
      }),
    });
    console.log(`var  CREATE ${name}`);
  }

  // --- Trigger ---
  const TRIGGER_NAME = 'CE - All Manifest Office events';
  const existingTrigs = await api(`${base}/triggers`);
  let trigger = (existingTrigs.trigger ?? []).find((t) => t.name === TRIGGER_NAME);
  if (!trigger) {
    trigger = await api(`${base}/triggers`, {
      method: 'POST',
      body: JSON.stringify({
        name: TRIGGER_NAME,
        type: 'customEvent',
        customEventFilter: [
          {
            type: 'matchRegex',
            parameter: [
              { type: 'template', key: 'arg0', value: '{{_event}}' },
              { type: 'template', key: 'arg1', value: `^(${EVENT_REGEX})$` },
            ],
          },
        ],
      }),
    });
    console.log(`trig CREATE ${TRIGGER_NAME} (id=${trigger.triggerId})`);
  } else {
    console.log(`trig SKIP   ${TRIGGER_NAME} (id=${trigger.triggerId})`);
  }

  // --- Tag (GA4 Event, forwards everything) ---
  const TAG_NAME = 'GA4 - Forward Manifest Office events';
  const existingTags = await api(`${base}/tags`);
  if ((existingTags.tag ?? []).some((t) => t.name === TAG_NAME)) {
    console.log(`tag  SKIP   ${TAG_NAME}`);
  } else {
    const eventParameters = DLV_KEYS.map((key) => ({
      type: 'map',
      map: [
        { type: 'template', key: 'name', value: key },
        { type: 'template', key: 'value', value: `{{DLV - ${key}}}` },
      ],
    }));
    await api(`${base}/tags`, {
      method: 'POST',
      body: JSON.stringify({
        name: TAG_NAME,
        type: 'gaawe',
        parameter: [
          { type: 'template', key: 'eventName', value: '{{Event}}' },
          { type: 'template', key: 'measurementIdOverride', value: GA4_MEASUREMENT_ID },
          { type: 'boolean', key: 'sendEcommerceData', value: 'true' },
          { type: 'template', key: 'getEcommerceDataFrom', value: 'dataLayer' },
          { type: 'list', key: 'eventParameters', list: eventParameters },
        ],
        firingTriggerId: [trigger.triggerId],
      }),
    });
    console.log(`tag  CREATE ${TAG_NAME}`);
  }

  console.log('\nDone. Open GTM → Preview → confirm tag fires → Submit → Publish.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
