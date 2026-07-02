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
