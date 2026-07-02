import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createBusinessAction } from './actions';

export default async function NewBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Nuevo negocio</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos del negocio</CardTitle>
          <CardDescription>
            Esto crea tu negocio en estado pendiente. Podrás publicarlo después de agregar al
            menos un servicio y un horario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={error} />
          <form action={createBusinessAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositPercentage">Porcentaje de depósito (%)</Label>
              <Input
                id="depositPercentage"
                name="depositPercentage"
                type="number"
                min={1}
                max={100}
                defaultValue={30}
              />
            </div>
            <Button type="submit" className="w-full">
              Crear negocio
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
