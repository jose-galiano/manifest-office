# GTM `GTM-5HMML5DX` — manual setup (5 minutes)

The JSON import failed because Google migrated the GA4 tag schema in 2024 and
import templates rot. This is the manual path. It's faster anyway.

Go to https://tagmanager.google.com → workspace **GTM-5HMML5DX** → Default
Workspace. Then do these four things in order.

---

## 1. Enable built-in Click variables (10 sec)

**Variables → Configure (top-right of "Built-In Variables")** → tick:

- Click Element
- Click URL
- Click Text

Save (close the panel).

---

## 2. Create 18 Data Layer Variables (3 min)

**Variables → User-Defined Variables → New** (or "+") for each row below.
Type for every one: **Data Layer Variable**. Data Layer Version: **Version 2**.

Tip: GTM lets you "Save as new" from an existing variable. Create the first
one, then duplicate-and-rename the rest.

| Variable name            | Data Layer Variable Name |
| ------------------------ | ------------------------ |
| `DLV - session_id`       | `session_id`             |
| `DLV - anonymous_id`     | `anonymous_id`           |
| `DLV - page_path`        | `page_path`              |
| `DLV - label`            | `label`                  |
| `DLV - section_name`     | `section_name`           |
| `DLV - depth_pct`        | `depth_pct`              |
| `DLV - handle`           | `handle`                 |
| `DLV - title`            | `title`                  |
| `DLV - price`            | `price`                  |
| `DLV - colorway`         | `colorway`               |
| `DLV - panel_index`      | `panel_index`            |
| `DLV - source`           | `source`                 |
| `DLV - duration_ms`      | `duration_ms`            |
| `DLV - distance_px`      | `distance_px`            |
| `DLV - destination_host` | `destination_host`       |
| `DLV - selector`         | `selector`               |
| `DLV - step`             | `step`                   |
| `DLV - option`           | `option`                 |

---

## 3. Create the trigger (30 sec)

**Triggers → New**.

- Name: `CE — All Manifest Office events`
- Trigger Type: **Custom Event**
- Event name: **paste exactly** (and tick "Use regex matching"):

```
^(page_view|section_view|section_dwell|scroll_depth|element_click|outbound_click|rage_click|dead_click|reserve_click|viewer_3d_rotate|viewer_3d_explode|viewer_3d_assemble|scroll_pin_panel|cart_drawer_open|cart_drawer_close|audio_play|audio_pause|manifest_complete|variant_view|email_capture_submit|consent_granted|consent_denied|view_item|view_item_list|select_item|add_to_cart|remove_from_cart|view_cart|begin_checkout|generate_lead|teletype_complete|dossier_filter)$
```

- This trigger fires on: **All Custom Events**
- Save.

---

## 4. Create the GA4 Event tag (1 min)

**Tags → New**.

- Name: `GA4 — Forward Manifest Office events`
- Tag type: **Google Analytics: GA4 Event**
- **Measurement ID**: `G-S63PX9NHSS` _(if it prompts for "Configuration Tag", choose "None" and use the Measurement ID directly — that's the new 2024 way)_
- **Event Name**: `{{Event}}` _(this is the built-in variable for the dataLayer event name — open the variable picker and pick `Event`)_

Expand **Event Parameters**. Click "Add Row" 17 times and paste:

| Parameter Name     | Value                        |
| ------------------ | ---------------------------- |
| `page_path`        | `{{DLV - page_path}}`        |
| `session_id`       | `{{DLV - session_id}}`       |
| `anonymous_id`     | `{{DLV - anonymous_id}}`     |
| `label`            | `{{DLV - label}}`            |
| `section_name`     | `{{DLV - section_name}}`     |
| `depth_pct`        | `{{DLV - depth_pct}}`        |
| `handle`           | `{{DLV - handle}}`           |
| `title`            | `{{DLV - title}}`            |
| `price`            | `{{DLV - price}}`            |
| `colorway`         | `{{DLV - colorway}}`         |
| `panel_index`      | `{{DLV - panel_index}}`      |
| `source`           | `{{DLV - source}}`           |
| `duration_ms`      | `{{DLV - duration_ms}}`      |
| `distance_px`      | `{{DLV - distance_px}}`      |
| `destination_host` | `{{DLV - destination_host}}` |
| `selector`         | `{{DLV - selector}}`         |
| `step`             | `{{DLV - step}}`             |
| `option`           | `{{DLV - option}}`           |

Expand **More Settings → Ecommerce** → tick **"Send Ecommerce data"** →
Source: **Data Layer**.

**Triggering** → pick `CE — All Manifest Office events`.

Save.

---

## 5. Preview → Submit → Publish (30 sec)

1. **Preview** (top-right) → enter `https://demo.maelify.com` → click around →
   confirm the Tag Assistant shows your tag firing on `page_view`,
   `scroll_depth`, `reserve_click`, etc.
2. **Submit** (top-right) → Version Name: `v1 — analytics baseline` → **Publish**.
3. In GA4 → **Reports → Realtime** → confirm events are arriving.

---

## 6. One-time: register custom dimensions in GA4

GA4 doesn't surface custom dataLayer params in reports until you register
them. **GA4 → Admin → Custom definitions → Create custom dimensions** →
for each parameter, Scope: **Event**, Parameter name: exactly as above.

You only need the dimensions you want to slice reports by. Minimum useful set:
`section_name`, `label`, `handle`, `colorway`, `panel_index`, `source`,
`depth_pct`. Add the rest later if needed.

Data starts populating in standard reports ~24h after registration. Realtime
shows them immediately.
