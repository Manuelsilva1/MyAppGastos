# API (Spring Boot 3, Java 21)

Estructura por feature. Cada carpeta contiene su controlador REST, servicio, repositorios JPA y DTOs.
Los tipos y reglas de dominio están en `db/migration` (Flyway) y en `docs/api/openapi.yaml`.

```
src/main/java/com/manuelsilva/finanzas/
├── auth/           registro, login, refresh tokens (JWT)
├── users/          perfil y preferencias del usuario
├── currencies/     catálogo de monedas
├── exchangerates/  cotizaciones cargadas a mano
├── accounts/       cuentas y saldo derivado
├── categories/     categorías y subcategorías
├── tags/           etiquetas
├── transactions/   gastos, ingresos y ajustes
├── transfers/      transferencias atómicas entre cuentas
├── recurring/      reglas recurrentes y ocurrencias
├── dashboard/      resumen de inicio
├── audit/          auditoría append-only
└── common/         errores RFC 7807, paginación keyset, manejo de idempotencia
```

Lo que todavía no existe (pom.xml, configuración de Spring, Docker Compose) llega en los entregables 5 y 6.
Las migraciones están en `src/main/resources/db/migration` y son el punto de partida del esquema.
