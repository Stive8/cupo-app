# Reserva Cliente / Reserva Prestador Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the existing, already-functional Cupo frontend (customer booking flow + business-owner panel) with the brand identity extracted from the imported `Reserva Cliente.dc.html` / `Reserva Prestador.dc.html` mockups, without adding any feature the backend doesn't support.

**Architecture:** Pure re-theme + light IA reorganization on top of the existing Next.js App Router + shadcn/ui (`@base-ui/react` primitives + `cva`) stack. Brand colors/fonts become CSS custom properties in `frontend/app/globals.css`, consumed automatically by every existing component (`Button`, `Card`, `Badge`, etc.) since they're already built on those tokens. The only structural changes are: (1) a real day-picker/time-chip slot selector on the business detail page, (2) a sidebar layout + a Dashboard/Ajustes split for the business-owner panel, and (3) a day-grouped "Agenda" view replacing the flat slot table. No new backend endpoints, no new component library.

**Tech Stack:** Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui (`@base-ui/react`) + `next/font/google`.

## Global Constraints

- Brand tokens: **Sereno color palette** (`--accent`/sage `#3C6E51`, warm off-white `--bg` `#F4F3EE`, `--ink` `#16170F`, etc.) combined with **Cálido fonts** (Plus Jakarta Sans body, Bricolage Grotesque display) — exact values are in Task 1. This is a fixed brand; no live theme switcher ships (the mockups' 3-theme picker was a design-tool exploration aid, not a product feature).
- Reuse existing `components/ui/*` (Button, Card, Input, Label, Textarea, Table, Badge) and existing server patterns (`apiFetch`/`ApiError` from `lib/server/api.ts`, `requireRole`/`getSession` from `lib/server/session.ts`, Server Actions with `redirect(...?error=...)`). Do not create a second, bespoke component system to chase the mockups' inline-style pixel fidelity.
- MVP-only scope (per `.claude/CLAUDE.md` and the approved design spec at `docs/superpowers/specs/2026-07-01-reserva-cliente-prestador-redesign-design.md`): no reviews, favorites, in-app messaging, client CRM, standalone revenue/reports page, multi-category/map search, staff-based agenda columns, reschedule, or "book again". If a task below doesn't mention a mockup element, it was deliberately dropped — don't add it back.
- Business-rule fidelity — never change this behavior, only its visuals: slot race-condition errors show the backend's exact message and the page must reflect current availability; cancellation outside the 24h window shows the backend's exact rejection reason; booking confirmation only reflects `approved` once the Wompi webhook has updated payment status (never assume success right after checkout); 403 on owner-mismatch mutations shows "no autorizado".
- **No frontend test framework exists in this repo** (`frontend/package.json` has no Jest/Vitest/Playwright/RTL). Per-task verification is `npm run lint` and `npm run build` inside `frontend/` (this is Next's full type-check + compile, and will fail on broken JSX/imports/types). The two flow checkpoints (Task 6 and Task 11) additionally run the **backend** e2e suite (`backend/test/*.e2e-spec.ts`, the only e2e suite in this repo — it's a NestJS API contract suite, unaffected by pure frontend changes, but running it after each flow is the regression check the user asked for) and a live Playwright browser walkthrough of the actual dev server, per this project's rule that UI changes must be exercised in a real browser before being called done.
- If, while implementing any task, a mockup detail turns out to conflict with a real business rule or a field that doesn't exist on the actual entity (`Business`, `Service`, `AvailabilitySlot`, `Booking`, `Payment` in `frontend/lib/types/api.ts`), stop and flag it rather than inventing data — don't guess.
- **Some pages intentionally have no task below and are not missing from this plan.** `frontend/app/reservar/[slotId]/page.tsx`, `frontend/app/reservas/[bookingId]/pagar/page.tsx`, `frontend/app/panel/layout.tsx`, `frontend/app/login/**`, and `frontend/app/register/page.tsx` only use components that already read from the CSS tokens (`Card`/`CardTitle`/`Button`/`Input`, all already `font-heading`/`bg-primary`/etc.-driven) with no raw unthemed headings — Task 1 alone rebrands them. Don't add tasks for them.

---

### Task 1: Brand tokens and fonts

**Files:**
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/layout.tsx`

**Interfaces:**
- Produces: CSS custom properties `--background`, `--foreground`, `--card`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border`, `--input`, `--ring`, `--sidebar*`, `--radius` (all re-valued, same names as before — every existing component already consumes these). Produces new font CSS variables `--font-sans` (Plus Jakarta Sans) and `--font-heading` (Bricolage Grotesque), and the `font-heading` Tailwind utility class (already referenced by `components/ui/card.tsx`'s `CardTitle`, currently a no-op because no font was ever wired to `--font-heading`).
- Consumes: nothing (foundational task, must land first).

- [ ] **Step 1: Replace `frontend/app/globals.css` with the new token values**

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-heading);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: #F4F3EE;
  --foreground: #16170F;
  --card: #FFFFFF;
  --card-foreground: #16170F;
  --popover: #FFFFFF;
  --popover-foreground: #16170F;
  --primary: #3C6E51;
  --primary-foreground: #FFFFFF;
  --secondary: #FAF9F4;
  --secondary-foreground: #16170F;
  --muted: #FAF9F4;
  --muted-foreground: #676B5C;
  --accent: #E7EFE9;
  --accent-foreground: #3C6E51;
  --destructive: oklch(0.577 0.245 27.325);
  --border: #E7E5DB;
  --input: #E7E5DB;
  --ring: #3C6E51;
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.75rem;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #16170F;
  --sidebar-primary: #3C6E51;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #E7EFE9;
  --sidebar-accent-foreground: #3C6E51;
  --sidebar-border: #E7E5DB;
  --sidebar-ring: #3C6E51;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

Note: `--destructive`, `.dark`, and `--chart-*` are left untouched — `.dark` is unused (no theme toggle wired anywhere in the app) and there's no red in the Sereno palette, so the existing destructive/error color stays as-is (errors should stay visually distinct regardless of brand).

- [ ] **Step 2: Replace `frontend/app/layout.tsx` to load Plus Jakarta Sans + Bricolage Grotesque**

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SessionNav } from "@/components/nav/session-nav";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cupo",
  description: "Reserva canchas deportivas en Colombia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} ${bricolageGrotesque.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionNav />
        <main className="flex-1">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors. (The build fetches the two new Google Fonts at build time — requires network access, same as the existing Geist fonts already do.)

- [ ] **Step 4: Commit**

```bash
git add frontend/app/globals.css frontend/app/layout.tsx
git commit -m "style: aplicar paleta Sereno y tipografia Calido como marca fija de Cupo"
```

---

### Task 2: Real slot picker on the business detail page

**Files:**
- Create: `frontend/components/booking/slot-picker.tsx`
- Modify: `frontend/app/negocios/[businessId]/page.tsx`

**Interfaces:**
- Consumes: `AvailabilitySlot`, `Service` types from `frontend/lib/types/api.ts` (fields: `slot.id`, `slot.status`, `slot.serviceId`, `slot.startTime`; `service.id`, `service.name`, `service.priceCents`, `service.currency`); `formatCents` from `frontend/lib/format.ts`.
- Produces: `SlotPicker` component with props `{ slots: AvailabilitySlot[]; services: Service[]; businessId: string }`, rendered as a client component. Links to the existing route `/reservar/${slotId}?businessId=${businessId}` — no new route.

- [ ] **Step 1: Create the slot picker component**

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCents } from '@/lib/format';
import type { AvailabilitySlot, Service } from '@/lib/types/api';

interface SlotPickerProps {
  slots: AvailabilitySlot[];
  services: Service[];
  businessId: string;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(iso: string): { dow: string; num: string } {
  const date = new Date(iso);
  return {
    dow: date.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
    num: String(date.getDate()),
  };
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
}

export function SlotPicker({ slots, services, businessId }: SlotPickerProps) {
  const available = [...slots]
    .filter((slot) => slot.status === 'available')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const groups = new Map<string, AvailabilitySlot[]>();
  for (const slot of available) {
    const key = dateKey(slot.startTime);
    const arr = groups.get(key) ?? [];
    arr.push(slot);
    groups.set(key, arr);
  }
  const days = Array.from(groups.keys());

  const [selectedDay, setSelectedDay] = useState<string | null>(days[0] ?? null);

  if (available.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay horarios disponibles por ahora.</p>;
  }

  const servicesById = new Map(services.map((service) => [service.id, service]));
  const dayTimes = groups.get(selectedDay ?? days[0]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {days.map((day) => {
          const { dow, num } = dayLabel(groups.get(day)![0].startTime);
          const active = day === (selectedDay ?? days[0]);
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={
                'flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ' +
                (active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted')
              }
            >
              <span className="uppercase opacity-70">{dow}</span>
              <span className="font-heading text-base">{num}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {dayTimes.map((slot) => {
          const service = servicesById.get(slot.serviceId);
          return (
            <Link
              key={slot.id}
              href={`/reservar/${slot.id}?businessId=${businessId}`}
              className="flex flex-col items-start gap-0.5 rounded-xl border border-border bg-background px-3.5 py-2 text-sm transition-colors hover:border-primary hover:bg-accent"
            >
              <span className="font-medium">{timeLabel(slot.startTime)}</span>
              {service && (
                <span className="text-xs text-muted-foreground">
                  {service.name} · {formatCents(service.priceCents, service.currency)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `frontend/app/negocios/[businessId]/page.tsx` to use it**

```tsx
import { notFound } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlotPicker } from '@/components/booking/slot-picker';
import type { AvailabilitySlot, Business, Service } from '@/lib/types/api';

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  let business: Business;
  try {
    business = await apiFetch<Business>(`/businesses/${businessId}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [services, slots] = await Promise.all([
    apiFetch<Service[]>(`/services/business/${businessId}`),
    apiFetch<AvailabilitySlot[]>(`/slots/business/${businessId}`),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{business.name}</h1>
        <p className="text-muted-foreground">
          {business.address}, {business.city}
        </p>
        {business.description && <p className="mt-2">{business.description}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este negocio aún no tiene servicios.</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="flex justify-between text-sm">
                <span>
                  {service.name} ({service.durationMinutes} min)
                </span>
                <span className="font-medium">
                  {formatCents(service.priceCents, service.currency)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Elige un horario</CardTitle>
        </CardHeader>
        <CardContent>
          <SlotPicker slots={slots} services={services} businessId={businessId} />
        </CardContent>
      </Card>
    </div>
  );
}
```

`/slots/business/:businessId` (unlike the `/manage` variant used in the panel) already only returns `available` slots server-side (`SlotsController.findAvailableByBusiness` in the backend) — the `status === 'available'` filter in `SlotPicker` is a defensive no-op given that, not a workaround for a bug.

- [ ] **Step 3: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/components/booking/slot-picker.tsx "frontend/app/negocios/[businessId]/page.tsx"
git commit -m "feat: reemplazar grid plano de horarios por selector de dia y hora"
```

---

### Task 3: Home page polish

**Files:**
- Modify: `frontend/app/page.tsx`

**Interfaces:**
- Consumes: `Business` type, `apiFetch`. No new interfaces produced (leaf page).

- [ ] **Step 1: Replace `frontend/app/page.tsx`**

```tsx
import Link from 'next/link';
import { apiFetch } from '@/lib/server/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Business } from '@/lib/types/api';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  const businesses = await apiFetch<Business[]>('/businesses', { query: { city } });

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-14">
      <div className="mx-auto max-w-xl space-y-3 text-center">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Reserva tu cancha, sin fricción.
        </h1>
        <p className="text-muted-foreground">
          Encuentra canchas deportivas disponibles cerca de ti y agenda en minutos.
        </p>
      </div>

      <form className="mx-auto flex max-w-md gap-2">
        <Input name="city" placeholder="Ciudad (ej. Bogotá)" defaultValue={city} />
        <Button type="submit">Buscar</Button>
      </form>

      {businesses.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No encontramos negocios{city ? ` en "${city}"` : ''} todavía.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Link key={business.id} href={`/negocios/${business.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">{business.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {business.city}
                  {business.description && <p className="mt-2">{business.description}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "style: rediseñar hero y busqueda de la pagina de inicio"
```

---

### Task 4: Top nav restyle

**Files:**
- Modify: `frontend/components/nav/session-nav.tsx`

**Interfaces:**
- Consumes: `getSession` from `frontend/lib/server/session.ts`, `LogoutButton` from `./logout-button.tsx` (unchanged). No behavioral change — same three states (anonymous / customer / business_owner).

- [ ] **Step 1: Replace `frontend/components/nav/session-nav.tsx`**

```tsx
import Link from 'next/link';
import { getSession } from '@/lib/server/session';
import { Button } from '@/components/ui/button';
import { LogoutButton } from './logout-button';

export async function SessionNav() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            C
          </span>
          Cupo
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {!session && (
            <>
              <Link href="/login" className="px-2 py-1 text-foreground/80 hover:text-foreground">
                Iniciar sesión
              </Link>
              <Button render={<Link href="/register">Regístrate</Link>} size="sm" />
            </>
          )}
          {session?.role === 'customer' && (
            <>
              <Link
                href="/reservas"
                className="rounded-lg px-3 py-2 font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Mis reservas
              </Link>
              <LogoutButton />
            </>
          )}
          {session?.role === 'business_owner' && (
            <>
              <Link
                href="/panel"
                className="rounded-lg px-3 py-2 font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                Mi panel
              </Link>
              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/components/nav/session-nav.tsx
git commit -m "style: rediseñar barra de navegacion superior"
```

---

### Task 5: Mis reservas + estado de reserva polish

**Files:**
- Modify: `frontend/app/reservas/page.tsx`
- Modify: `frontend/app/reservas/[bookingId]/estado/page.tsx`

**Interfaces:**
- Consumes: `Booking`, `Payment`, `PaymentStatus` types (unchanged); `cancelBookingAction` from `./actions.ts` (unchanged, not touched by this task).

- [ ] **Step 1: Replace `frontend/app/reservas/page.tsx`**

```tsx
import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { apiFetch } from '@/lib/server/api';
import { formatCents, formatDateTime } from '@/lib/format';
import { FormError } from '@/components/form-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Booking, BookingStatus } from '@/lib/types/api';
import { cancelBookingAction } from './actions';

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pendiente de pago',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

const STATUS_VARIANT: Record<BookingStatus, 'default' | 'secondary' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'outline',
  completed: 'secondary',
};

export default async function MyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await requireRole('customer');
  const bookings = await apiFetch<Booking[]>('/bookings/me', { token: session.token });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-semibold">Mis reservas</h1>
      <FormError message={error} />

      {bookings.length === 0 ? (
        <p className="text-muted-foreground">
          Todavía no tienes reservas.{' '}
          <Link href="/" className="underline">
            Busca una cancha
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const boundCancel = cancelBookingAction.bind(null, booking.id);
            const cancellable = booking.status === 'pending' || booking.status === 'confirmed';
            return (
              <Card key={booking.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div className="space-y-1 text-sm">
                    <Badge variant={STATUS_VARIANT[booking.status]}>
                      {STATUS_LABEL[booking.status]}
                    </Badge>
                    <p>Depósito: {formatCents(booking.depositCents)}</p>
                    <p className="text-muted-foreground">
                      Creada: {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === 'pending' && (
                      <Button
                        render={<Link href={`/reservas/${booking.id}/pagar`}>Pagar</Link>}
                        size="sm"
                      />
                    )}
                    {cancellable && (
                      <form action={boundCancel}>
                        <Button type="submit" variant="outline" size="sm">
                          Cancelar
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace `frontend/app/reservas/[bookingId]/estado/page.tsx`**

```tsx
import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import { formatCents } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Payment, PaymentStatus } from '@/lib/types/api';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Esperando confirmación del pago...',
  approved: '¡Reserva confirmada!',
  rejected: 'El pago fue rechazado. Tu reserva fue cancelada.',
  refunded: 'El pago fue reembolsado.',
};

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requireRole('customer');

  let payment: Payment | null = null;
  try {
    payment = await apiFetch<Payment>(`/payments/booking/${bookingId}`, { token: session.token });
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }

  const status = payment?.status ?? 'pending';
  const approved = status === 'approved';

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {status === 'pending' && <meta httpEquiv="refresh" content="3" />}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{STATUS_LABEL[status]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payment && (
            <p className="text-sm text-muted-foreground">
              Depósito: {formatCents(payment.amountCents, payment.currency)}
            </p>
          )}
          {approved ? (
            <div className="flex gap-2">
              <Button render={<Link href="/reservas">Ver mis reservas</Link>} className="flex-1" />
              <Button
                render={<Link href="/">Explorar más</Link>}
                variant="outline"
                className="flex-1"
              />
            </div>
          ) : (
            <Link href="/reservas" className="text-sm underline">
              Ver mis reservas
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

`STATUS_LABEL['approved']` copy changed from "¡Pago aprobado!..." to "¡Reserva confirmada!" — still only rendered when the real `payment.status` from the backend is `'approved'`; the pending-state polling (`<meta httpEquiv="refresh">`) and the 404-tolerant fetch are untouched, so a booking still never appears confirmed before the Wompi webhook actually confirms it.

- [ ] **Step 3: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/reservas/page.tsx "frontend/app/reservas/[bookingId]/estado/page.tsx"
git commit -m "style: rediseñar mis reservas y estado de reserva"
```

---

### Task 6: Checkpoint — verify the Reserva Cliente flow end to end

**Files:** none (verification only).

- [ ] **Step 1: Build check**

Run: `cd frontend && npm run lint && npm run build`
Expected: succeeds.

- [ ] **Step 2: Backend regression check**

Run: `cd backend && npm run test:e2e -- businesses` then `npm run test:e2e -- services` then `npm run test:e2e -- slots` then `npm run test:e2e -- bookings` then `npm run test:e2e -- payments`
Expected: all suites pass (these are the backend contracts every customer-facing page in Tasks 1-5 depends on — a pass confirms the frontend still matches the real API shape, since none of these tasks touched backend code).

- [ ] **Step 3: Live browser walkthrough**

Start both dev servers (`cd backend && npm run start:dev` and `cd frontend && npm run dev`), then use the Playwright browser tools to: open the home page and confirm the new colors/fonts render; search a city with a seeded/published `sports_field` business; open the business detail page and confirm the day/time picker renders and only shows `available` slots; click a slot, submit the confirm form, land on the Wompi pay page; go to "Mis reservas" and confirm the booking appears with the correct status badge; cancel a cancellable booking and confirm the real backend message (or the 24h-window rejection reason, if applicable) is what's displayed, not a generic error.

Expected: no console errors, no broken layout, all business-rule messaging (race-condition, 24h window, pending-vs-confirmed state) still shows the real backend text.

- [ ] **Step 4: Report**

If anything in Steps 1-3 fails, fix it in the relevant task's files before moving on to Task 7 — do not proceed with a broken Cliente flow.

---

### Task 7: Panel list & new-business heading polish

**Files:**
- Modify: `frontend/app/panel/page.tsx`
- Modify: `frontend/app/panel/nuevo/page.tsx`

**Interfaces:** none new — cosmetic-only, one-line heading change in each file.

- [ ] **Step 1: In `frontend/app/panel/page.tsx`, change the `<h1>`**

Change:
```tsx
        <h1 className="text-2xl font-semibold">Mis negocios</h1>
```
to:
```tsx
        <h1 className="font-heading text-2xl font-semibold">Mis negocios</h1>
```

- [ ] **Step 2: In `frontend/app/panel/nuevo/page.tsx`, change the `<h1>`**

Change:
```tsx
      <h1 className="text-2xl font-semibold">Nuevo negocio</h1>
```
to:
```tsx
      <h1 className="font-heading text-2xl font-semibold">Nuevo negocio</h1>
```

- [ ] **Step 3: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/panel/page.tsx frontend/app/panel/nuevo/page.tsx
git commit -m "style: aplicar tipografia de marca a titulos del panel"
```

---

### Task 8: Business-scoped sidebar layout

**Files:**
- Create: `frontend/components/nav/panel-sidebar-nav.tsx`
- Create: `frontend/app/panel/[businessId]/layout.tsx`
- Modify: `frontend/lib/server/businesses.ts`

**Interfaces:**
- Consumes: `requireRole`, `getOwnedBusinessOrNotFound` (updated in this task), `Badge` component.
- Produces: `PanelSidebarNav` component with prop `{ businessId: string }`, a client component that highlights the active section via `usePathname()`. Produces the nav route map: Dashboard (`/panel/:id`), Agenda (`/panel/:id/horarios`), Reservas (`/panel/:id/reservas`), Servicios (`/panel/:id/servicios`), Ajustes (`/panel/:id/ajustes`) — Task 9 must create the `ajustes` route for this to resolve. Produces a memoized `listOwnedBusinesses(token)` (wrapped in React `cache()`) — Task 9's Dashboard page relies on this to avoid a duplicate `/businesses/me` fetch when both the layout and the page call `getOwnedBusinessOrNotFound` in the same request.

- [ ] **Step 1: Wrap `listOwnedBusinesses` in React `cache()`**

Replace `frontend/lib/server/businesses.ts` with:

```ts
import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { apiFetch } from './api';
import type { Business } from '../types/api';

export const listOwnedBusinesses = cache((token: string): Promise<Business[]> => {
  return apiFetch<Business[]>('/businesses/me', { token });
});

export async function getOwnedBusinessOrNotFound(
  token: string,
  businessId: string,
): Promise<Business> {
  const businesses = await listOwnedBusinesses(token);
  const business = businesses.find((b) => b.id === businessId);
  if (!business) notFound();
  return business;
}
```

This mirrors the existing `cache()` pattern already used by `getSession` in `frontend/lib/server/session.ts` — same request, same token, one network call, whether it's called from the new layout (Task 8) or a page (Task 9) underneath it.

- [ ] **Step 2: Create the sidebar nav client component**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '', label: 'Dashboard' },
  { href: '/horarios', label: 'Agenda' },
  { href: '/reservas', label: 'Reservas' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/ajustes', label: 'Ajustes' },
];

export function PanelSidebarNav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const base = `/panel/${businessId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {NAV_ITEMS.map((item) => {
        const href = `${base}${item.href}`;
        const active = pathname === href;
        return (
          <Link
            key={item.href}
            href={href}
            className={
              'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
              (active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Create the business-scoped layout**

```tsx
import type { ReactNode } from 'react';
import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { Badge } from '@/components/ui/badge';
import { PanelSidebarNav } from '@/components/nav/panel-sidebar-nav';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Publicado',
  suspended: 'Suspendido',
};

export default async function BusinessPanelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const session = await requireRole('business_owner');
  const business = await getOwnedBusinessOrNotFound(session.token, businessId);

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="shrink-0 rounded-2xl border border-sidebar-border bg-sidebar p-4 lg:w-56">
        <div className="mb-4 space-y-1">
          <p className="truncate font-heading text-base font-semibold text-sidebar-foreground">
            {business.name}
          </p>
          <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
            {STATUS_LABEL[business.status]}
          </Badge>
        </div>
        <PanelSidebarNav businessId={businessId} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: succeeds. Next.js doesn't validate `<Link href>` targets at build time, so the sidebar's Ajustes link (`/panel/:id/ajustes`) will 404 if clicked in a browser right now — that's expected, since that route doesn't exist until Task 9. `frontend/app/panel/[businessId]/page.tsx` still has its own old `<nav>` and business-edit form at this point too (untouched by this task); Task 9 replaces it.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/nav/panel-sidebar-nav.tsx "frontend/app/panel/[businessId]/layout.tsx" frontend/lib/server/businesses.ts
git commit -m "feat: agregar layout con sidebar para el panel de negocio"
```

---

### Task 9: Split the business page into Dashboard + Ajustes

**Files:**
- Modify (full rewrite): `frontend/app/panel/[businessId]/page.tsx`
- Create: `frontend/app/panel/[businessId]/ajustes/page.tsx`
- Create: `frontend/app/panel/[businessId]/ajustes/actions.ts`
- Delete: `frontend/app/panel/[businessId]/actions.ts`

**Interfaces:**
- Consumes: `PanelSidebarNav`'s Ajustes link (`/panel/:id/ajustes`, produced in Task 8) — this task is what makes that link resolve.
- Produces: `updateBusinessAction(businessId, formData)` and `publishBusinessAction(businessId)` now live in `ajustes/actions.ts` (same signatures as before, just relocated — nothing outside this route imports them, confirmed by `grep -rn "from '\.\./actions'" frontend/app/panel` returning only the old `page.tsx`, which this task rewrites).

- [ ] **Step 1: Rewrite `frontend/app/panel/[businessId]/page.tsx` as the Dashboard**

```tsx
import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { apiFetch } from '@/lib/server/api';
import { formatCents, formatDateTime } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AvailabilitySlot, Booking } from '@/lib/types/api';

export default async function BusinessDashboardPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const session = await requireRole('business_owner');
  const business = await getOwnedBusinessOrNotFound(session.token, businessId);

  const [bookings, slots] = await Promise.all([
    apiFetch<Booking[]>(`/bookings/business/${businessId}`, { token: session.token }),
    apiFetch<AvailabilitySlot[]>(`/slots/business/${businessId}`),
  ]);

  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const revenueCents = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.depositCents, 0);

  const now = Date.now();
  const upcoming = bookings
    .filter((b) => b.status === 'confirmed')
    .map((b) => ({ booking: b, slot: slotsById.get(b.slotId) }))
    .filter((x): x is { booking: Booking; slot: AvailabilitySlot } =>
      Boolean(x.slot) && new Date(x.slot.startTime).getTime() > now,
    )
    .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>

      {business.status !== 'active' && (
        <Card className="border-primary/40 bg-accent">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
            <span>Tu negocio todavía no está publicado.</span>
            <Link
              href={`/panel/${businessId}/ajustes`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Publicar en Ajustes →
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Confirmadas</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">{confirmedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pendientes de pago</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">{pendingCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Completadas</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">{completedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Ingresos por depósitos</CardTitle>
          </CardHeader>
          <CardContent className="font-heading text-3xl font-semibold">
            {formatCents(revenueCents)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas reservas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes reservas confirmadas próximas.</p>
          ) : (
            upcoming.map(({ booking, slot }) => (
              <div key={booking.id} className="flex items-center justify-between text-sm">
                <span>{formatDateTime(slot.startTime)}</span>
                <span className="text-muted-foreground">{formatCents(booking.depositCents)}</span>
              </div>
            ))
          )}
          <Link
            href={`/panel/${businessId}/horarios`}
            className="inline-block pt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ver agenda →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

"Ingresos por depósitos" sums `depositCents` (not `totalCents`) for `confirmed`/`completed` bookings — per the MVP payment rule, only the deposit is ever actually collected, so summing `totalCents` would overstate real revenue.

- [ ] **Step 2: Create `frontend/app/panel/[businessId]/ajustes/actions.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/server/session';
import { apiFetch, ApiError } from '@/lib/server/api';
import type { Business } from '@/lib/types/api';

export async function updateBusinessAction(businessId: string, formData: FormData) {
  const session = await requireRole('business_owner');
  const depositRaw = formData.get('depositPercentage');

  try {
    await apiFetch<Business>(`/businesses/${businessId}`, {
      method: 'PATCH',
      token: session.token,
      body: {
        name: formData.get('name'),
        address: formData.get('address'),
        city: formData.get('city'),
        description: formData.get('description') || undefined,
        depositPercentage: depositRaw ? Number(depositRaw) : undefined,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(`/panel/${businessId}/ajustes?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  revalidatePath(`/panel/${businessId}`);
  redirect(`/panel/${businessId}/ajustes`);
}

export async function publishBusinessAction(businessId: string) {
  const session = await requireRole('business_owner');

  try {
    await apiFetch<Business>(`/businesses/${businessId}/publish`, {
      method: 'POST',
      token: session.token,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      redirect(`/panel/${businessId}/ajustes?error=${encodeURIComponent(error.message)}`);
    }
    throw error;
  }

  revalidatePath(`/panel/${businessId}`);
  redirect(`/panel/${businessId}/ajustes`);
}
```

`revalidatePath('/panel/${businessId}')` (the Dashboard path, not just `/ajustes`) is kept so the Dashboard's "not published" banner disappears immediately after publishing, without a manual refresh.

- [ ] **Step 3: Create `frontend/app/panel/[businessId]/ajustes/page.tsx`**

```tsx
import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateBusinessAction, publishBusinessAction } from './actions';

export default async function BusinessSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { businessId } = await params;
  const { error } = await searchParams;
  const session = await requireRole('business_owner');
  const business = await getOwnedBusinessOrNotFound(session.token, businessId);

  const boundUpdate = updateBusinessAction.bind(null, businessId);
  const boundPublish = publishBusinessAction.bind(null, businessId);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Ajustes</h1>
      <FormError message={error} />

      {business.status !== 'active' && (
        <form action={boundPublish}>
          <Button type="submit">Publicar negocio</Button>
        </form>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Editar información</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={boundUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={business.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={business.address} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" defaultValue={business.city} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" name="description" defaultValue={business.description ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositPercentage">Porcentaje de depósito (%)</Label>
              <Input
                id="depositPercentage"
                name="depositPercentage"
                type="number"
                min={1}
                max={100}
                defaultValue={business.depositPercentage}
              />
            </div>
            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Delete the old actions file**

```bash
git rm "frontend/app/panel/[businessId]/actions.ts"
```

- [ ] **Step 5: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors. This resolves the "missing `/ajustes` route" note from Task 8 Step 4.

- [ ] **Step 6: Commit**

```bash
git add "frontend/app/panel/[businessId]/page.tsx" "frontend/app/panel/[businessId]/ajustes"
git commit -m "feat: separar dashboard con metricas reales y ajustes del negocio"
```

---

### Task 10: Agenda timeline + Servicios/Reservas heading polish

**Files:**
- Modify (full rewrite): `frontend/app/panel/[businessId]/horarios/page.tsx`
- Modify: `frontend/app/panel/[businessId]/servicios/page.tsx`
- Modify: `frontend/app/panel/[businessId]/reservas/page.tsx`

**Interfaces:**
- Consumes: `createSlotAction`, `blockSlotAction`, `unblockSlotAction`, `deleteSlotAction` from `./actions.ts` (unchanged, not touched by this task).

- [ ] **Step 1: Rewrite `frontend/app/panel/[businessId]/horarios/page.tsx` as a day-grouped agenda**

```tsx
import { requireRole } from '@/lib/server/session';
import { getOwnedBusinessOrNotFound } from '@/lib/server/businesses';
import { apiFetch } from '@/lib/server/api';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AvailabilitySlot, Service } from '@/lib/types/api';
import { createSlotAction, blockSlotAction, unblockSlotAction, deleteSlotAction } from './actions';

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  booked: 'Reservado',
  blocked: 'Bloqueado',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  available: 'default',
  booked: 'secondary',
  blocked: 'outline',
};

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayHeading(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function timeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${new Date(startIso).toLocaleTimeString('es-CO', opts)} – ${new Date(endIso).toLocaleTimeString('es-CO', opts)}`;
}

export default async function SlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { businessId } = await params;
  const { error } = await searchParams;
  const session = await requireRole('business_owner');
  await getOwnedBusinessOrNotFound(session.token, businessId);

  const [slots, services] = await Promise.all([
    apiFetch<AvailabilitySlot[]>(`/slots/business/${businessId}/manage`, { token: session.token }),
    apiFetch<Service[]>(`/services/business/${businessId}`),
  ]);

  const boundCreate = createSlotAction.bind(null, businessId);

  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const groups = new Map<string, AvailabilitySlot[]>();
  for (const slot of sorted) {
    const key = dateKey(slot.startTime);
    const arr = groups.get(key) ?? [];
    arr.push(slot);
    groups.set(key, arr);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Agenda</h1>
      <FormError message={error} />

      <Card>
        <CardHeader>
          <CardTitle>Próximos horarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {groups.size === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tienes horarios.</p>
          ) : (
            Array.from(groups.entries()).map(([day, daySlots]) => (
              <div key={day} className="space-y-2">
                <h3 className="font-heading text-sm font-semibold capitalize text-foreground">
                  {dayHeading(daySlots[0].startTime)}
                </h3>
                <div className="space-y-2">
                  {daySlots.map((slot) => {
                    const boundBlock = blockSlotAction.bind(null, businessId, slot.id);
                    const boundUnblock = unblockSlotAction.bind(null, businessId, slot.id);
                    const boundDelete = deleteSlotAction.bind(null, businessId, slot.id);
                    return (
                      <div
                        key={slot.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">
                            {timeRange(slot.startTime, slot.endTime)}
                          </span>
                          <Badge variant={STATUS_VARIANT[slot.status]}>
                            {STATUS_LABEL[slot.status]}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          {slot.status === 'available' && (
                            <>
                              <form action={boundBlock}>
                                <Button type="submit" variant="outline" size="sm">
                                  Bloquear
                                </Button>
                              </form>
                              <form action={boundDelete}>
                                <Button type="submit" variant="ghost" size="sm">
                                  Eliminar
                                </Button>
                              </form>
                            </>
                          )}
                          {slot.status === 'blocked' && (
                            <form action={boundUnblock}>
                              <Button type="submit" variant="outline" size="sm">
                                Desbloquear
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crear horario</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Crea primero un servicio para poder agregar horarios.
            </p>
          ) : (
            <form action={boundCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceId">Servicio</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  required
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Inicio</Label>
                <Input id="startTime" name="startTime" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Fin</Label>
                <Input id="endTime" name="endTime" type="datetime-local" required />
              </div>
              <Button type="submit">Crear horario</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

No staff columns — `staff_members`/`availability_slots.staff_member_id` are unused in the MVP per `.claude/CLAUDE.md`, so the agenda groups by day only, not by staff.

- [ ] **Step 2: In `frontend/app/panel/[businessId]/servicios/page.tsx`, change the `<h1>`**

Change:
```tsx
      <h1 className="text-2xl font-semibold">Servicios</h1>
```
to:
```tsx
      <h1 className="font-heading text-2xl font-semibold">Servicios</h1>
```

- [ ] **Step 3: In `frontend/app/panel/[businessId]/reservas/page.tsx`, change the `<h1>`**

Change:
```tsx
      <h1 className="text-2xl font-semibold">Reservas</h1>
```
to:
```tsx
      <h1 className="font-heading text-2xl font-semibold">Reservas</h1>
```

- [ ] **Step 4: Verify it builds**

Run: `cd frontend && npm run lint && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add "frontend/app/panel/[businessId]/horarios/page.tsx" "frontend/app/panel/[businessId]/servicios/page.tsx" "frontend/app/panel/[businessId]/reservas/page.tsx"
git commit -m "feat: reemplazar tabla plana de horarios por agenda agrupada por dia"
```

---

### Task 11: Checkpoint — verify the Reserva Prestador flow end to end

**Files:** none (verification only).

- [ ] **Step 1: Build check**

Run: `cd frontend && npm run lint && npm run build`
Expected: succeeds.

- [ ] **Step 2: Backend regression check**

Run: `cd backend && npm run test:e2e -- businesses` then `npm run test:e2e -- services` then `npm run test:e2e -- slots` then `npm run test:e2e -- bookings`
Expected: all suites pass (the panel's Dashboard, Agenda, Servicios, Reservas, and Ajustes pages built in Tasks 7-10 all depend on these four contracts — a pass confirms no backend assumption was broken by the frontend-only changes).

- [ ] **Step 3: Live browser walkthrough**

With both dev servers running, use the Playwright browser tools, logged in as a `business_owner` with at least one business: open `/panel` and confirm the heading renders in the display font; open a business and confirm the new sidebar (Dashboard/Agenda/Reservas/Servicios/Ajustes) renders with the business name and status badge, and that the active section highlights correctly as you navigate between them; on Dashboard, confirm the stat numbers match what you'd expect from the seeded bookings (not placeholder text) and that the "not published" banner only appears for a `pending`/`suspended` business; on Agenda, confirm slots are grouped by day and block/unblock/delete still work; on Ajustes, confirm editing business info and publishing still work and redirect back to `/ajustes`; attempt a mutation as a different owner (or simulate a 403) and confirm "no autorizado" is what's shown, not a generic error.

Expected: no console errors, no broken layout, all links in the sidebar resolve (no 404s), 403 messaging is verbatim from the backend.

- [ ] **Step 4: Report**

If anything in Steps 1-3 fails, fix it in the relevant task's files. Once this checkpoint is clean, both flows are done — update the design spec status line to "Implemented" and stop.

```bash
git add docs/superpowers/specs/2026-07-01-reserva-cliente-prestador-redesign-design.md
git commit -m "docs: marcar spec de rediseño como implementado"
```
