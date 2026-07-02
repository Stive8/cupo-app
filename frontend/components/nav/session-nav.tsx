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
