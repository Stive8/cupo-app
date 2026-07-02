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
