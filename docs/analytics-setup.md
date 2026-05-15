# Analytics setup — demo.maelify.com

End-to-end wiring for the Manifest Office demo: GTM container `GTM-5HMML5DX`,
GA4 property `G-S63PX9NHSS`, Microsoft Clarity (optional), Consent Mode v2.

## 1. Import the GTM container

1. Open https://tagmanager.google.com → workspace **GTM-5HMML5DX**.
2. **Admin → Import Container**.
3. Choose `docs/gtm-import.json` from this repo.
4. Workspace: **Existing → Default Workspace**.
5. Import option: **Merge → Overwrite conflicting tags, triggers, and variables**.
6. Click **Confirm**. The import creates:
   - 1 GA4 Configuration tag (points at `G-S63PX9NHSS`).
   - 1 GA4 Event tag that forwards every Manifest Office custom event to GA4
     with all standard parameters mapped.
   - 1 Custom Event trigger (regex-matches the full event taxonomy).
   - 18 Data Layer Variables (one per param we emit).
   - 8 Built-in Variables enabled.
7. Click **Submit → Publish**. Name the version `v1 — analytics baseline`.

## 2. Vercel env vars

In Vercel → Project `manifest-office` → Settings → Environment Variables, add
to **Production** (and Preview if you want tracking in PR deploys):

```
NEXT_PUBLIC_GTM_ID       GTM-5HMML5DX
NEXT_PUBLIC_CLARITY_ID   <paste-after-clarity-signup-or-leave-blank>
```

Redeploy after adding — `NEXT_PUBLIC_*` vars are inlined at build time.

## 3. Microsoft Clarity (optional but recommended)

Clarity is the layer that gives you **video replay of every session +
heatmaps + frustration auto-detection**. Free, unlimited, owned by Microsoft.

1. https://clarity.microsoft.com → sign in with Google.
2. **Create project** → Name: `demo.maelify.com` → URL: `https://demo.maelify.com`.
3. After creation, the dashboard shows a project ID like `s8a3xkq2lr`.
4. Paste into `NEXT_PUBLIC_CLARITY_ID` in Vercel → redeploy.
5. First sessions appear in Clarity ~30 minutes after first visits.

No GTM tag is required — Clarity is wired directly into the layout
component when the env var is present.

## 4. Verify

After deploying:

1. Open https://demo.maelify.com in an incognito window.
2. Open DevTools → Console → run `window.dataLayer`. You should see a list
   that starts with the consent-default object, then `page_view`, plus
   `scroll_depth` and `section_view` entries as you scroll.
3. In GTM, click **Preview** → enter `https://demo.maelify.com` → confirm
   the Tag Assistant shows the GA4 Configuration and GA4 Event tags firing.
4. In GA4 → **Reports → Realtime**, confirm events arriving (use the
   "Event count by Event name" card).
5. Click around (Reserve, open cart, rotate 3D viewer). Watch new events
   stream in.

## 5. Event taxonomy

All events live in `src/lib/analytics/types.ts`. The forwarder tag picks
them up by regex, so adding a new event = add the literal there and
update the trigger regex in GTM.

| Event                  | When it fires                                    |
| ---------------------- | ------------------------------------------------ |
| `page_view`            | Every SPA route change.                          |
| `section_view`         | Section enters viewport (via `<SectionView>`).   |
| `section_dwell`        | Section leaves viewport, with `dwell_ms`.        |
| `scroll_depth`         | Page scrolled past 10/25/50/75/90/100%.          |
| `element_click`        | Any element with `data-track="<label>"` clicked. |
| `outbound_click`       | Click on an `<a>` to a different host.           |
| `rage_click`           | 3+ clicks <800ms on same element.                |
| `dead_click`           | Click on non-interactive element.                |
| `reserve_click`        | PDP Reserve button pressed.                      |
| `add_to_cart`          | Reservation succeeded (GA4 ecommerce shape).     |
| `view_item`            | PDP loaded (GA4 ecommerce shape).                |
| `view_cart`            | Cart drawer opened (GA4 ecommerce shape).        |
| `variant_view`         | Colorway swapped on PDP.                         |
| `viewer_3d_rotate`     | User dragged the 3D viewer (one per drag-end).   |
| `viewer_3d_explode`    | Latch viewer toggled to exploded state.          |
| `viewer_3d_assemble`   | Latch viewer toggled to assembled state.         |
| `scroll_pin_panel`     | BuildYourSystem horizontal panel changed.        |
| `cart_drawer_open`     | Slide-in drawer opened.                          |
| `cart_drawer_close`    | Slide-in drawer closed.                          |
| `email_capture_submit` | Footer email form submitted.                     |
| `generate_lead`        | Same submission, GA4-canonical shape.            |
| `consent_granted`      | Cookie banner accepted.                          |
| `consent_denied`       | Cookie banner declined.                          |

## 6. GA4 — register the custom dimensions

GA4 doesn't surface dataLayer params in standard reports until you register
them as **custom dimensions**. One-time setup:

1. GA4 → **Admin → Custom definitions → Create custom dimensions**.
2. For each of these, add a dimension at **Event scope** with the
   parameter name matching the dataLayer key:
   - `label`, `section_name`, `handle`, `title`, `colorway`,
     `panel_index`, `source`, `depth_pct`, `destination_host`, `selector`,
     `step`, `option`, `duration_ms`, `distance_px`.

3. Save. Data starts populating within 24 hours.

After that, you can build explorations like:

- Funnel: `view_item` → `reserve_click` → `add_to_cart`.
- Free-form: rows = `section_name`, metric = users, filter `event_name = section_view`.
- Free-form: rows = `label`, metric = event count, filter `event_name = element_click`.

## 7. Adding new tracked elements

Two patterns:

**Declarative** (preferred for static buttons / links):

```tsx
<button data-track="newsletter_signup" data-track-position="hero">
  Subscribe
</button>
```

The auto-click tracker picks it up and emits `element_click` with
`label = "newsletter_signup"`, `position = "hero"`. No code change.

**Imperative** (for events tied to state, animations, async results):

```ts
import { CUSTOM_EVENTS, track } from '@/lib/analytics';

track(CUSTOM_EVENTS.reserveClick, {
  params: { handle, price },
  ecommerce: { currency: 'EUR', value: price, items: [{ ... }] },
  fanout: { klaviyo: true },
});
```

If it's a brand-new event name not already in `CUSTOM_EVENTS`:

1. Add it to `src/lib/analytics/types.ts`.
2. Add the same literal to the **CE — All Manifest Office events** trigger
   regex in GTM.
3. Publish a new GTM version.
