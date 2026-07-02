import Link from 'next/link';
import { requireRole } from '@/lib/server/session';
import { listOwnedBusinesses } from '@/lib/server/businesses';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Publicado',
  suspended: 'Suspendido',
};

export default async function PanelHomePage() {
  const session = await requireRole('business_owner');
  const businesses = await listOwnedBusinesses(session.token);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Mis negocios</h1>
        <Button render={<Link href="/panel/nuevo">+ Nuevo negocio</Link>} nativeButton={false} />
      </div>

      {businesses.length === 0 && (
        <p className="text-muted-foreground">Todavía no has creado ningún negocio.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {businesses.map((business) => (
          <Link key={business.id} href={`/panel/${business.id}`}>
            <Card className="transition-colors hover:border-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{business.name}</CardTitle>
                <Badge variant={business.status === 'active' ? 'default' : 'secondary'}>
                  {STATUS_LABEL[business.status]}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{business.city}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
