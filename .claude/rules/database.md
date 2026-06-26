# Reglas de base de datos

## Migraciones
- Nunca usar `synchronize: true` fuera de entornos locales de prueba rápida — el esquema real se gestiona con migraciones de TypeORM.
- Generar migraciones con `npm run migration:generate -- --name=Nombre`, nunca editarlas a mano salvo ajustes menores ya generados.
- Toda migración debe ser reversible (`up` y `down` implementados).
- Correr migraciones con `npm run migration:run` antes de levantar el servidor en un entorno nuevo.

## Naming conventions
- Tablas y columnas: `snake_case` (ej. `business_id`, `created_at`).
- Nombres de tabla en plural (`users`, `bookings`, `availability_slots`).
- Toda tabla usa `id UUID` como PK generado con `uuid` (nunca autoincremental).
- Foreign keys nombradas como `<entidad>_id` (ej. `slot_id`, `service_id`).
- Precios siempre como `<campo>_cents INT` (integer), nunca `decimal` ni `float`, para evitar errores de punto flotante.

## Soft deletes
- Ninguna tabla hace `DELETE` físico. Todas usan columna `deleted_at` (nullable timestamp).
- Usar el decorador `@DeleteDateColumn()` de TypeORM y los métodos `softDelete()` / `softRemove()`.
- Las queries por defecto deben excluir registros con `deleted_at IS NOT NULL` (comportamiento por defecto de TypeORM con `@DeleteDateColumn`).

## Integridad de datos críticos
- Reservar un slot (`availability_slots`) y crear el `booking` correspondiente debe hacerse dentro de una transacción de base de datos para evitar doble reserva.
- El campo `metadata JSONB` en `businesses` es el único lugar para atributos específicos de cada vertical — no agregar columnas nuevas por vertical al esquema base.
