# Reserva Cliente / Reserva Prestador — visual redesign

Status: Implemented (branch `redesign/reserva-cliente-prestador`).

## Context

Two design mockups were imported as standalone interactive HTML prototypes (`Reserva Cliente.dc.html`, `Reserva Prestador.dc.html`, repo root) via claude.ai/design. No working "import from URL" MCP tool was available in this session (`DesignSync` only pushes local files *to* claude.ai/design); the `.dc.html` files already present locally were used as the design reference instead.

Both mockups describe a full multi-vertical marketplace product (categories, map search, favorites, reviews, in-app messaging, client CRM, revenue reports, staff scheduling) that goes well beyond the current MVP, which is single-vertical (`sports_field`), B2B-then-B2C, with no reviews/staff/multi-vertical per `.claude/CLAUDE.md`. The existing frontend (`frontend/app/**`) already implements exactly the MVP's real flows against the NestJS backend contract (`{ success, data, message?, timestamp }`, server-only `apiFetch`, Server Actions for mutations, session via `cupo_session` JWT cookie).

Decision (user-approved): **MVP-only re-skin.** Apply the mockups' visual language (color, type, layout, spacing) only to flows the backend actually supports today. Do not build screens or nav items for modules with no backend — omit entirely, no "próximamente" placeholders.

## 1. Design system

Adopt the **Sereno** color palette combined with the **Cálido** type pairing from the mockups' shared `THEMES` object (both files ship the same three curated themes — a design-tool exploration aid, not a shipped feature; one fixed brand is chosen here):

```
--bg:          #F4F3EE
--surface:     #FFFFFF
--surface2:    #FAF9F4
--ink:         #16170F
--ink2:        #676B5C
--ink3:        #9CA08D
--line:        #E7E5DB
--accent:      #3C6E51   (sage green)
--accent-soft: #E7EFE9
--font-sans:    'Plus Jakarta Sans', system-ui, sans-serif   (Cálido)
--font-display: 'Bricolage Grotesque', system-ui, sans-serif (Cálido)
```

Map these onto the *existing* shadcn token names in `frontend/app/globals.css` (`--background`, `--foreground`, `--card`, `--primary`/`--accent`, `--muted-foreground`, `--border`, `--input`, `--ring`) rather than introducing a parallel `--ink`/`--surface` variable system — the app already has a token layer, this redesign re-values it. Load the two Google Fonts via `next/font/google` following the existing `Geist`/`Geist_Mono` pattern in `frontend/app/layout.tsx`. Base `--radius` may increase modestly (from `0.625rem` toward ~`0.75rem`) to match the mockups' softer corners; no other structural token changes.

No live theme switcher ships — it was a design-tool artifact for comparing the three options.

Component library: reuse existing `components/ui/*` (Button, Card, Input, Label, Textarea, Table, Badge, Select, Dialog, Separator) and existing patterns (`FormError`, Server Actions with `redirect(...?error=...)`, `requireRole`, `apiFetch`/`ApiError`). Do not create a second, bespoke component system to chase the mockups' inline-style pixel fidelity.

## 2. Reserva Cliente — screen mapping

| Mockup screen | Real route | Treatment |
|---|---|---|
| Home / Discovery | `app/page.tsx` | Re-themed hero + city search + business list. Drop category pills and "destacados" image grid (no vertical categories, no business photos in the schema). |
| Search Results (filters, map) | — | Dropped. No map, no category filter, no ratings — none of that data exists on `Business`. |
| Detail (gallery, reviews) | `app/negocios/[businessId]/page.tsx` | Re-themed services + availability. Drop photo gallery and reviews block (no data). Replace the flat slot grid with a real day-picker + time-chip picker, grouping actual `AvailabilitySlot[]` by date — genuine UX upgrade since it's driven by real data. |
| Booking Flow Step 1–2 (calendar, notes) | `app/reservar/[slotId]/page.tsx` | Re-themed confirm form. Date/time already chosen on the detail page's picker. |
| Booking Flow Step 3 (payment method icons) | — | Dropped. Wompi's hosted widget (`WompiCheckoutButton`) already owns method selection; a second, fake picker in our UI would misrepresent the real payment flow. |
| Confirmation ("¡Reserva confirmada!", instant) | `app/reservas/[bookingId]/estado/page.tsx` | Adapted, not copied 1:1: booking confirms only via Wompi webhook, so this stays a pending/confirmed state machine (existing polling behavior) restyled to match the mockup's confirmation visuals once `status === 'approved'`; rejected/refunded states keep their own real messaging. |
| Trips / Reservations (reschedule, book again, leave review) | `app/reservas/page.tsx` | Re-themed list. Keep cancel (real, with the 24h-window error surfaced verbatim from the backend). Drop reschedule, "reservar de nuevo", "dejar opinión" — no backend for any of them. |

## 3. Reserva Prestador — screen mapping

| Mockup screen | Real route | Treatment |
|---|---|---|
| Sidebar nav | `app/panel/layout.tsx` | New sidebar: Dashboard, Agenda, Reservas, Servicios, Ajustes. Drop Clientes, Mensajes, Ingresos nav entries entirely. |
| Dashboard (stats + agenda link) | `app/panel/[businessId]/page.tsx` | Reinterpreted as a real stats view: booking counts by status, upcoming bookings, revenue sum from real `Booking.totalCents`/deposits, computed from `/bookings/business/:id` — no invented numbers, no mockup greeting copy. |
| Agenda (timeline, staff columns) | `app/panel/[businessId]/horarios/page.tsx` | Re-themed as a day-timeline of real slots. Drop staff columns (`staff_members`/`availability_slots.staff_member_id` unused in the MVP per `CLAUDE.md`). Keep create/block/unblock/delete actions as-is. |
| Reservas | `app/panel/[businessId]/reservas/page.tsx` | Re-themed table/cards, same data (`Booking[]`). |
| Clientes (CRM) | — | Dropped. No customer-profile/visit-history backend. |
| Servicios | `app/panel/[businessId]/servicios/page.tsx` | Re-themed only. |
| Mensajes | — | Dropped. No messaging backend. |
| Ingresos (standalone page) | — | Dropped as a page; folded into a real summary card on Dashboard (see above). |
| Ajustes | New page, replaces current content of `panel/[businessId]/page.tsx` | Business info edit form (name/address/city/description/deposit%) + publish action — this is what `panel/[businessId]/page.tsx` does today, relocated under Ajustes and restyled. |

## 4. Explicit backlog (dropped scope, for future phases)

Reviews, favorites, in-app messaging, client CRM, standalone revenue/reports page, multi-category/map search, staff-based agenda columns, reschedule, "book again".

## 5. Business-rule fidelity

No change to logic — only visuals/layout move. Preserve verbatim:
- Slot race-condition booking errors → "este horario ya no está disponible" + refreshed availability, not a generic error.
- Cancellation outside the 24h window → real backend rejection reason shown, not generic.
- Payment: reflect "pendiente de confirmación" until the Wompi webhook confirms; never assume success right after checkout.
- Owner-mismatch mutations (403) → "no autorizado", not generic.

## 6. Testing

Run the existing e2e suite after each restyled flow lands (not just once at the end), and report immediately — not just at planning time — if any mockup element turns out to conflict with a real business rule once implementation gets into the details.

## 7. Explicit judgment calls (user-approved)

1. Dashboard shows real computed stats, not the mockup's static greeting copy.
2. Slot selection becomes a real day-picker + time-chip UI grouping actual slot data, not the mockup's flat grid — but also not the mockup's open-ended calendar (we only ever show days/times that have real `AvailabilitySlot`s).
