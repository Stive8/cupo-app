# Reglas de API

## Formato de respuesta
Todos los endpoints deben retornar siempre esta forma, sin excepción:
```ts
{
  success: boolean,
  data: any,
  message?: string,
  timestamp: string // ISO 8601
}
```
- Usar un interceptor global (`common/interceptors`) para envolver las respuestas exitosas.
- Usar un filtro global de excepciones (`common/filters`) para envolver los errores en el mismo formato, con `success: false`.

## Validación
- Todo body de entrada se valida con un DTO usando `class-validator` + `class-transformer`.
- Activar `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true` en `main.ts`.
- Los DTOs viven junto a su módulo (`<modulo>/dto/`) o en `common/dto` si son compartidos entre módulos.
- Nunca confiar en datos del cliente sin pasar por un DTO validado.

## Autenticación y autorización
- JWT obligatorio en todas las rutas protegidas, vía un `AuthGuard` en `common/guards`.
- Las rutas públicas (búsqueda, listados) deben declararse explícitamente con un decorador `@Public()` en `common/decorators`.
- El payload del JWT solo contiene `sub` (user id) y `role`. Nunca incluir datos sensibles.
- Roles ('customer', 'business_owner', 'admin') se validan con un `RolesGuard` + decorador `@Roles()`.

## Rate limiting
- Todas las rutas públicas deben tener `@nestjs/throttler` configurado.
- Configurar límites más estrictos en endpoints de auth (login, registro) para mitigar fuerza bruta.
