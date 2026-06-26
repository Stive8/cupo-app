# Reglas de seguridad — Pagos (Wompi)

## Datos que NUNCA se guardan en la DB
- Número de tarjeta (PAN), CVV, fecha de expiración, ni ningún dato sensible de tarjeta.
- La tabla `payments` solo almacena `provider_reference` (el ID que devuelve Wompi) y el `status` de la transacción.

## Flujo de pago
- El frontend interactúa directamente con el widget/checkout de Wompi; el backend nunca recibe ni procesa datos crudos de tarjeta.
- El backend solo recibe el `provider_reference` tras la confirmación de Wompi y lo asocia al `booking` correspondiente.
- Los estados de `payments.status` ('pending', 'approved', 'rejected', 'refunded') deben sincronizarse vía webhook de Wompi, no solo por respuesta síncrona del cliente.

## Webhooks
- Validar la firma/autenticidad de cada webhook de Wompi antes de procesarlo (evitar payloads falsificados).
- El procesamiento de webhooks debe ser idempotente: un mismo evento recibido más de una vez no debe duplicar pagos ni reservas.

## Credenciales
- `WOMPI_PUBLIC_KEY` y `WOMPI_PRIVATE_KEY` solo viven en `.env`, nunca hardcodeadas ni commiteadas.
- La llave privada nunca se expone al frontend; solo se usa en el backend para validar webhooks o llamadas server-to-server.

## Relación con reservas
- Solo se cobra un depósito (`deposit_cents`), no el total del servicio, según las reglas de negocio del MVP.
- Un `booking` pasa a `confirmed` solo cuando el pago asociado está en estado `approved`.
- Un pago `rejected` no debe dejar el slot en estado `booked` — debe liberarse de vuelta a `available`.
