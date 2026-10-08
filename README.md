# Finanzas

App de finanzas personales: cuentas, gastos, ingresos, transferencias y gastos fijos. Un solo código de app para Android, iOS y web, y una API REST propia.

- `apps/mobile-web`: app Expo (Expo Router, NativeWind, TanStack Query, Zustand).
- `apps/api`: API Spring Boot 3 (Java 21, Flyway, PostgreSQL).
- `packages/shared`: aritmética de dinero con strings (sin floats) y esquemas Zod compartidos.
- `docs/`: especificación, modelo ER, contrato OpenAPI y guía de deploy.

## Requisitos

- Node 20.19 o superior y npm.
- Java 21 y Maven 3.9 (para la API).
- Docker y Docker Compose (para levantar base y API juntas).

## Levantar todo con Docker

```bash
docker compose up --build
```

Levanta PostgreSQL 16 en `localhost:5432` y la API en `http://localhost:8080/api/v1`. Las migraciones de Flyway corren al arrancar la API. Para un entorno compartido, definí `JWT_SECRET` (mínimo 32 caracteres) y `CORS_ALLOWED_ORIGINS` con el dominio de la web.

## API sin Docker

Necesitás una PostgreSQL 16 accesible. Las variables por defecto apuntan a `localhost:5432` con usuario y clave `finanzas`.

```bash
cd apps/api
mvn spring-boot:run
```

Tests (la integración corre contra PostgreSQL real):

```bash
# Con Docker disponible, Testcontainers levanta la base solo:
mvn test

# Sin Docker, apuntá a una base existente:
TEST_DB_URL=jdbc:postgresql://localhost:5432/finanzas TEST_DB_USER=finanzas TEST_DB_PASSWORD=finanzas mvn test
```

## App (mobile y web)

```bash
npm install                          # desde la raíz: instala los workspaces
cd apps/mobile-web
npx expo start                       # Expo Go en el celular, o `w` para el navegador
npx expo start --web                 # solo web
```

Variables públicas (`EXPO_PUBLIC_*`), en `apps/mobile-web/.env` o en el panel del hosting:

| Variable | Qué hace |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base de la API, por ejemplo `http://localhost:8080`. |
| `EXPO_PUBLIC_DEMO` | `true` fuerza datos de ejemplo aunque haya API. |

Sin `EXPO_PUBLIC_API_URL` la app abre con datos de ejemplo y un aviso visible.

Tests y typecheck:

```bash
npm test          # desde la raíz: paquete compartido y app
npm run typecheck
```

Build web estático (lo que usa Vercel, ver `docs/deploy-vercel.md`):

```bash
npm run build --workspace @finanzas/mobile-web
```

## Estado

Hecho:

- Auth con JWT y refresh tokens rotados.
- Cuentas con saldo derivado de los movimientos.
- Movimientos con alta idempotente, listado paginado por cursor y anulación.
- Transferencias atómicas, con anulación y test que fuerza el fallo de una pata.
- Resumen de inicio con conversión de monedas y cotizaciones faltantes reportadas.
- Interfaz: navegación (sidebar en web, barra inferior en mobile), inicio, carga rápida y listado.

Pendiente:

- Recurrentes: el job diario que genera ocurrencias y su confirmación.
- Cola offline de la app.
- Pantallas de cuentas, categorías y ajustes con formularios.
- Modo oscuro manual y revisión de contraste (tres pares de texto en modo claro no cumplen AA).
- Error de hidratación de React al abrir `/login` directo en el export estático.

Documentación: `docs/especificacion.md` (requisitos), `docs/modelo-er.md`, `docs/api/openapi.yaml`, `docs/deploy-vercel.md`.
