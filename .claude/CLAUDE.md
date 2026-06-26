# Cupo — Marketplace de reservas multi-vertical

## Stack
- Backend: NestJS + TypeScript (Node 22)
- Base de datos: PostgreSQL + TypeORM
- Frontend: Next.js (fase 2)
- Pagos: Wompi (PSE + tarjeta)
- Notificaciones: Twilio WhatsApp + Resend email

## Arquitectura
- Monolito modular NestJS — un módulo por dominio
- Multi-vertical: campo `vertical` en `businesses` define el tipo
- Verticales: 'sports_field' | 'barbershop' | 'beauty_center' | 'professional'
- Precios SIEMPRE en centavos como integer (50000 = COP $500.00)
- UUIDs como PK en todas las tablas
- Soft deletes con deleted_at — nunca DELETE físico
- Slots como entidades propias con estado: 'available' | 'booked' | 'blocked'

## Estructura
backend/src/
├── auth/
├── users/
├── businesses/
├── services/
├── slots/
├── bookings/
├── payments/
├── notifications/
└── common/ (guards, decorators, filters, interceptors)

## Convenciones
- Archivos: kebab-case
- Clases: PascalCase
- Variables/funciones: camelCase
- Tablas DB: snake_case
- DTOs: siempre validar con class-validator
- Respuesta API estándar: { success, data, message?, timestamp }
- Commits: conventional commits (feat:, fix:, chore:, docs:)

## Comandos
- npm run start:dev — desarrollo
- npm run build — compilar
- npm run test — tests unitarios
- npm run migration:generate -- --name=Nombre — crear migración
- npm run migration:run — correr migraciones

## Reglas de seguridad — CRÍTICAS
- Nunca guardar datos de tarjeta, CVV ni PAN en la DB
- Pagos: solo guardar provider_reference de Wompi y estado
- JWT obligatorio en todas las rutas protegidas
- Rate limiting en todas las rutas públicas
- Variables sensibles solo en .env, nunca hardcodeadas

## Reglas de negocio
- Un slot solo puede tener una reserva activa (usar transacción DB)
- Al cancelar reserva, slot vuelve a 'available' automáticamente
- Recordatorios se programan al CONFIRMAR reserva, no al crearla
- Reseñas solo si la reserva está en estado 'completed'

## Respuesta API estándar
Todos los endpoints retornan:
{
  success: boolean,
  data: any,
  message?: string,
  timestamp: string
}

## Alcance del MVP — mono-vertical, B2B antes de B2C
- El MVP cubre **un solo vertical: canchas deportivas (`sports_field`)**. Barberías, belleza y profesionales llegan en V2+.
- Se construye **primero el lado B2B** (negocio: perfil, servicios, slots) y **después el B2C** (usuario: búsqueda, reserva, pago) — el B2C necesita datos reales creados por el B2B para probarse.
- Notificaciones (WhatsApp + email) **sí están en el MVP** — reducen no-shows y dan confianza al negocio piloto.
- Reseñas (`reviews`) **no están en el MVP** — dependen de tener historial de reservas `completed`, que no existe en las primeras semanas. Pasan a V2.
- `staff_members` y `availability_slots.staff_member_id` existen en el esquema desde el MVP pero no se usan en ningún flujo de canchas — están ahí para no migrar de nuevo cuando se agregue el vertical de barberías.

## Lo que NO va en el MVP
- Barberías, belleza, profesionales (un solo vertical hasta validar el piloto)
- Reseñas (`reviews`)
- Comisión, boost de visibilidad, reportes premium B2B
- App móvil nativa
- Facturación DIAN
- IA de precios dinámicos
- Multi-sede
- Pago total (solo depósito por ahora)

## Roadmap post-MVP
- **V2 — segundo vertical (barberías):** activa `staff_members` (obligatorio en este vertical) y slots por empleado. Sin reviews ni comisión todavía — el objetivo es validar que el modelo de datos multi-vertical funciona sin reescribir esquema.
- **V3 — monetización:** reseñas (solo si `booking.status = 'completed'`), comisión 4-7% por reserva pagada en plataforma, boost de visibilidad.
- **V4 — premium B2B / tercer vertical:** reportes avanzados y multi-sede para negocios; posible tercer vertical (`beauty_center` o `professional`).
- Backlog sin fecha: app móvil nativa, facturación DIAN, IA de precios dinámicos, pago del total de la reserva (vs. depósito).

## Modelo de negocio
- Freemium: negocios entran gratis sin fricción
- Comisión: 4-7% por cada reserva pagada en plataforma (se activa en V3, después de validar el segundo vertical — no antes)
- Boost de visibilidad: negocios pagan para aparecer primero en búsquedas (V3)
- Funciones premium B2B: reportes avanzados, multi-sede (V4)
- NUNCA cobrar suscripción mensual fija como modelo principal

## Competencia conocida
- Easycancha: solo canchas, fuerte en Colombia
- AgendaPro: solo belleza/bienestar, modelo B2B
- Fresha/Booksy: solo belleza, mercado global
- Nuestra ventaja: único multi-vertical con marketplace B2C en Colombia

## Diseño de base de datos — 9 tablas

### users
id UUID PK, email, password_hash, full_name, phone,
role ENUM('customer','business_owner','admin'),
created_at, deleted_at

### businesses
id UUID PK, owner_id FK(users), name,
vertical ENUM('sports_field','barbershop','beauty_center','professional'),
description, address, city, lat FLOAT, lng FLOAT,
metadata JSONB,  ← atributos únicos por vertical
status ENUM('pending','active','suspended'),
created_at, deleted_at

### services
id UUID PK, business_id FK, name,
duration_minutes INT, price_cents INT, currency VARCHAR(3),
is_active BOOL, deleted_at

### staff_members
id UUID PK, business_id FK, name,
role VARCHAR, is_active BOOL
← En MVP de canchas: no se usa. En barbería V2: obligatorio

### availability_slots
id UUID PK, business_id FK, service_id FK,
staff_member_id FK NULLABLE,  ← null en canchas, requerido en barbería
start_time TIMESTAMP, end_time TIMESTAMP,
status ENUM('available','booked','blocked'),
capacity INT DEFAULT 1, booked_count INT DEFAULT 0

### bookings
id UUID PK, user_id FK, business_id FK,
slot_id FK, service_id FK,
status ENUM('pending','confirmed','cancelled','completed'),
total_cents INT, deposit_cents INT,
notes TEXT, created_at, cancelled_at

### payments
id UUID PK, booking_id FK,
provider VARCHAR DEFAULT 'wompi',
provider_reference VARCHAR,  ← ID que da Wompi, nunca datos de tarjeta
amount_cents INT, currency VARCHAR(3),
status ENUM('pending','approved','rejected','refunded'),
created_at

### notifications
id UUID PK, user_id FK, booking_id FK,
channel ENUM('whatsapp','email','push'),
type ENUM('confirmation','reminder_24h','reminder_1h','cancellation'),
status ENUM('pending','sent','failed'),
scheduled_at TIMESTAMP, sent_at TIMESTAMP

### reviews
id UUID PK, booking_id FK, user_id FK, business_id FK,
rating INT CHECK(1-5), comment TEXT, created_at
← Solo se puede crear si booking.status = 'completed'

## Decisiones de arquitectura tomadas
- Monolito modular ahora, preparado para extraer microservicios después
- NO microservicios ni Kubernetes en MVP (problema de escala que aún no existe)
- PostgreSQL como única DB (no Redis, no MongoDB por ahora)
- Slots como entidades propias para evitar doble reserva
- JSONB metadata en businesses para no alterar schema al agregar verticales
- Precios en centavos integer (nunca decimal) para evitar errores de punto flotante

## Flujos principales del MVP

### Onboarding negocio
registro → crear perfil → configurar servicios y precios → configurar horarios → publicar

### Reserva de usuario
buscar por ciudad → ver disponibilidad → seleccionar slot → pagar depósito → confirmado

### Cancelación
usuario cancela → validar política 24h → slot vuelve a 'available' → notificar negocio

## Roadmap del MVP (canchas, B2B → B2C)
- Semanas 1-2: setup + entidades TypeORM (incluye `staff_members` sin uso aún) + conexión DB
- Semanas 3-4: `auth` + módulo `businesses` + `services` (lado B2B: perfil, servicios, precios)
- Semanas 5-6: módulo `slots` (lado B2B: horarios/disponibilidad)
- Semanas 7-8: búsqueda + módulo `bookings` (lado B2C: flujo de reserva completo sobre datos reales del B2B)
- Semana 9: pagos con Wompi (depósito)
- Semana 10: notificaciones WhatsApp + email
- Semanas 11-12: testing + piloto con canchas reales
