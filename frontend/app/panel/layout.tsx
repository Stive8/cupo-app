import type { ReactNode } from 'react';
import { requireRole } from '@/lib/server/session';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireRole('business_owner');
  return <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>;
}
