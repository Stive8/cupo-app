import Link from 'next/link';
import { getSession } from '@/lib/server/session';
import { Button } from '@/components/ui/button';
import { LogoutButton } from './logout-button';

export async function SessionNav() {
  const session = await getSession();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Cupo
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {!session && (
            <>
              <Link href="/login">Iniciar sesión</Link>
              <Button render={<Link href="/register">Regístrate</Link>} size="sm" />
            </>
          )}
          {session?.role === 'customer' && (
            <>
              <Link href="/reservas">Mis reservas</Link>
              <LogoutButton />
            </>
          )}
          {session?.role === 'business_owner' && (
            <>
              <Link href="/panel">Mi panel</Link>
              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
