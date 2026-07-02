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
