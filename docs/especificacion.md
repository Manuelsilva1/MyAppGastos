# Rol
Actuá como arquitecto y desarrollador full-stack senior. Vas a diseñar e implementar una app de finanzas personales para mobile (Android/iOS) y web. Priorizá la consistencia de los datos, la trazabilidad y un código mantenible por sobre las features vistosas.

# Objetivo
Una app para registrar y controlar mis finanzas personales: cuentas, gastos, ingresos, transferencias entre cuentas y gastos fijos recurrentes. Debe tener reportes claros y una carga de gastos muy rápida desde el celular.

# Stack
- App: React Native con Expo (SDK estable más reciente) + TypeScript, un único código para Android, iOS y web (react-native-web)
- Navegación: Expo Router (rutas por archivos, compartidas entre mobile y web)
- Estado del servidor: TanStack Query (cache y reintentos); estado local: Zustand
- UI: NativeWind (Tailwind), configurado con los tokens definidos en "Diseño visual"
- Íconos: lucide-react-native
- Gráficos: Victory Native en mobile (con alternativa web si hace falta); elegí y justificá
- Formularios: React Hook Form + Zod, con los esquemas compartidos con los tipos de la API
- Almacenamiento seguro del token: expo-secure-store en mobile y almacenamiento seguro equivalente en web
- Backend: Java 21 + Spring Boot 3 (REST), Spring Data JPA, Flyway, Bean Validation, PostgreSQL
- Auth: JWT con refresh token (un usuario por ahora, pero el modelo debe ser multiusuario)
- Tests: JUnit 5 + Testcontainers en el backend; Jest + React Native Testing Library en la app
- Docker Compose para el backend y la DB

# Reglas de dominio (no negociables)
1. El dinero se maneja con BigDecimal / NUMERIC(19,4). En la app, los montos viajan como string y nunca se opera con number de JS para cálculos de dinero.
2. Multimoneda: cada cuenta tiene una moneda (UYU, USD, etc.). Una transferencia entre cuentas de distinta moneda guarda el monto de origen, el monto de destino y el tipo de cambio aplicado.
3. El saldo de una cuenta se DERIVA de sus movimientos: `saldo = initial_balance + SUM(amount)` de los movimientos no anulados. No se guarda un saldo editable a mano. Si hace falta un cache, tiene que ser recalculable.
4. Una transferencia NO es un gasto ni un ingreso. Se modela como una operación con dos movimientos vinculados (TRANSFER_OUT y TRANSFER_IN) que se crean y anulan de forma atómica.
5. Los movimientos no se borran físicamente: se anulan (soft delete) y queda auditoría (quién, cuándo, valor anterior y nuevo).
6. Toda operación que afecte saldos corre dentro de una transacción.
7. La UI se diseña mobile-first. En web, aprovechá las pantallas anchas: listado y detalle lado a lado, y tablas en lugar de listas.
8. La carga rápida de un gasto debe completarse en 3 toques o menos desde la pantalla principal, con un botón flotante. Recordá la última cuenta y categoría usadas.
9. Offline básico en mobile: los gastos cargados sin conexión se guardan en cola y se sincronizan al volver la red, con un ID generado en el cliente (UUID) para que la API sea idempotente y no haya duplicados.

# Modelo de datos (PostgreSQL)
Este modelo ya está definido; implementalo así. Si detectás un problema, señalalo antes de cambiarlo.

Convenciones para todas las tablas:
- PK `id UUID`. En `transactions` y `transfers` el ID lo puede generar el cliente.
- `created_at` y `updated_at TIMESTAMPTZ` en todas las tablas.
- `version INT` para optimistic locking en `accounts`, `transactions`, `transfers` y `recurring_rules`.
- Los montos son `NUMERIC(19,4)` y las monedas `CHAR(3)` en formato ISO 4217.
- Todas las entidades del usuario llevan `user_id`, y toda consulta filtra por él.

## Fase 1

**users**
- `id`, `email` (UNIQUE), `password_hash`, `name`, `base_currency` (default 'UYU'), `locale` (default 'es-UY')

**refresh_tokens**
- `id`, `user_id` FK, `token_hash`, `expires_at`, `revoked_at`

**currencies**
- `code` PK, `name`, `symbol` ('$', 'US$'), `decimals`
- Seed inicial: UYU, USD, ARS, BRL, EUR.

**exchange_rates**
- `id`, `user_id` FK, `from_currency`, `to_currency`, `rate NUMERIC(19,8)`, `rate_date DATE`, `source` ('MANUAL' | 'API')
- UNIQUE (`user_id`, `from_currency`, `to_currency`, `rate_date`).
- Para convertir a la moneda base se usa la cotización más reciente con `rate_date` menor o igual a la fecha consultada.

**accounts**
- `id`, `user_id` FK, `name`
- `type` ('CASH' | 'BANK' | 'CREDIT_CARD' | 'WALLET' | 'SAVINGS')
- `currency` FK, `initial_balance` (default 0), `initial_balance_date`
- `color`, `icon`, `include_in_total BOOL` (default true), `sort_order INT`, `archived_at`
- UNIQUE (`user_id`, `name`) para las cuentas no archivadas (índice parcial).

**categories**
- `id`, `user_id` FK, `parent_id` FK nullable (máximo 2 niveles)
- `name`, `kind` ('EXPENSE' | 'INCOME'), `color`, `icon`, `sort_order`, `archived_at`
- Una subcategoría tiene el mismo `kind` que su padre.
- UNIQUE (`user_id`, `parent_id`, `name`).

**tags**
- `id`, `user_id` FK, `name`
- UNIQUE (`user_id`, `name`).

**transfers**
- `id`, `user_id` FK, `from_account_id` FK, `to_account_id` FK
- `from_amount`, `to_amount` (ambos > 0), `exchange_rate NUMERIC(19,8)` nullable
- `occurred_on DATE`, `description`, `voided_at`
- CHECK `from_account_id <> to_account_id`.
- Si las cuentas tienen la misma moneda, `from_amount = to_amount` y `exchange_rate` queda NULL.

**transactions** (movimientos)
- `id`, `user_id` FK, `account_id` FK
- `type` ('EXPENSE' | 'INCOME' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT')
- `amount NUMERIC(19,4)` con signo: negativo es salida y positivo es entrada. Siempre está en la moneda de la cuenta.
- CHECKs por tipo:
  - EXPENSE y TRANSFER_OUT: `amount < 0`
  - INCOME y TRANSFER_IN: `amount > 0`
  - ADJUSTMENT: `amount <> 0`
- `category_id` FK nullable: obligatorio para EXPENSE e INCOME, NULL para el resto.
- `transfer_id` FK nullable: obligatorio para TRANSFER_OUT y TRANSFER_IN.
- `recurring_occurrence_id` FK nullable.
- `description`, `note`, `occurred_on DATE`, `voided_at`, `void_reason`
- Índices: (`user_id`, `occurred_on` DESC), (`account_id`, `occurred_on`), (`category_id`) y (`transfer_id`).

**transaction_tags**
- PK (`transaction_id`, `tag_id`).

**recurring_rules**
- `id`, `user_id` FK, `name`, `kind` ('EXPENSE' | 'INCOME'), `account_id` FK, `category_id` FK
- `amount` (positivo), `is_estimate BOOL` (si es true, el monto se ajusta al confirmar)
- `frequency` ('WEEKLY' | 'MONTHLY' | 'YEARLY' | 'EVERY_N_DAYS'), `interval_count INT` (default 1)
- `day_of_month` (1-31), `day_of_week` (1-7)
- `start_date`, `end_date` nullable, `next_due_date`, `active BOOL`, `auto_confirm BOOL` (default false)
- Si `day_of_month` no existe en un mes, se usa el último día de ese mes (por ejemplo, el 31 cae el 28 o 29 en febrero, o el 30 en abril).

**recurring_occurrences**
- `id`, `rule_id` FK, `due_date`, `expected_amount`
- `status` ('PENDING' | 'CONFIRMED' | 'SKIPPED'), `transaction_id` FK nullable, `resolved_at`
- UNIQUE (`rule_id`, `due_date`), para que la generación sea idempotente.
- Un job diario genera las ocurrencias de los próximos 30 días. Al confirmar una ocurrencia se crea su transaction y se vinculan ambas en la misma transacción de DB.

**audit_log**
- `id BIGSERIAL`, `user_id`, `entity_type`, `entity_id`
- `action` ('CREATE' | 'UPDATE' | 'VOID'), `before JSONB`, `after JSONB`, `at`

## Fase 2

**credit_card_details**
- `account_id` PK y FK, solo para cuentas de tipo CREDIT_CARD
- `credit_limit`, `closing_day`, `due_day`

**installment_plans**
- `id`, `user_id`, `account_id`, `category_id`, `description`
- `total_amount`, `installments_count`, `first_installment_date`
- Cada cuota es una transaction con `installment_plan_id` e `installment_number`; agregá esas columnas a `transactions`.

**budgets**
- `id`, `user_id`, `category_id`, `month DATE` (primer día del mes), `amount`, `currency`
- UNIQUE (`user_id`, `category_id`, `month`).

**attachments**
- `id`, `transaction_id` FK, `storage_key`, `mime_type`, `size_bytes`

## Consultas clave (implementá vistas o queries optimizadas)
- **Saldo por cuenta:** `initial_balance + SUM(amount)` donde `voided_at IS NULL`.
- **Gasto por categoría en un período:** `SUM(-amount)` donde `type = 'EXPENSE'`. El agrupado incluye las subcategorías bajo su categoría padre.
- **Patrimonio:** suma de los saldos de las cuentas con `include_in_total` convertidos a `base_currency`.
- **Regla importante:** las transferencias nunca cuentan en los totales de gastos o ingresos.

# Diseño visual

## Concepto
Sobrio, cálido y legible, como una libreta de cuentas moderna. Los números son los protagonistas; el color se usa con intención: verde para entradas, rojo para salidas, azul para transferencias y ámbar para lo pendiente. Nada de gradientes ni sombras pesadas.

## Tokens de color

| Token | Light | Dark |
|---|---|---|
| background | #F6F5F1 | #111412 |
| surface | #FFFFFF | #1A1E1B |
| surface-2 | #EFEDE7 | #232823 |
| border | #E2DFD6 | #2E342F |
| text | #1A1D1A | #ECEDE8 |
| text-muted | #6B6F68 | #9CA19A |
| primary | #1F5F4A | #5FBF98 |
| on-primary | #FFFFFF | #0D1F18 |
| income | #2E7D5B | #5FBF98 |
| expense | #C2453D | #F07C73 |
| transfer | #4A6FA5 | #8FB0E0 |
| pending | #C98A12 | #F2C46D |
| danger | #B3261E | #F2B8B5 |

- Todos los pares de texto deben cumplir contraste WCAG AA.
- El modo oscuro sigue al sistema por defecto, con un toggle manual en Ajustes.
- Las cuentas y categorías usan una paleta propia de 12 colores apagados, que se muestran sobre fondos tintados al 15% de opacidad.

## Tipografía
- **Fuente:** Inter (expo-google-fonts).
- **Montos:** siempre con `fontVariant: ['tabular-nums']` para que las cifras se alineen en columna.
- **Escala:**

| Estilo | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| display | 34/40 | 700 | Patrimonio y monto en la carga |
| title | 22/28 | 600 | Títulos de pantalla |
| heading | 17/22 | 600 | Encabezados de sección |
| body | 15/22 | 400 | Texto general |
| caption | 13/18 | 400 | Texto secundario (text-muted) |
| overline | 11/16 | 600 | Etiquetas, en mayúsculas y con tracking 0.5 |

- Soporte de tamaño de texto dinámico del sistema, sin romper los layouts.

## Espaciado, forma y elevación
- **Espaciado:** escala de 4 px (4, 8, 12, 16, 24, 32, 48). Padding de pantalla de 16 en mobile y 24 en web.
- **Radios:** 10 en inputs y botones, 16 en cards, 24 en bottom sheets y "full" en chips y FAB.
- **Elevación:** cards con borde de 1 px en el color `border`, sin sombra. Solo el FAB y los bottom sheets llevan sombra suave.
- **Áreas táctiles:** mínimo 44×44.

## Formato de montos
- Locale es-UY: `$ 1.234,50`, `US$ 120,00`.
- **Gasto:** `− $ 450,00` en color `expense`.
- **Ingreso:** `+ $ 32.000,00` en color `income`.
- **Transferencia:** monto en `text`, con ícono de flechas en color `transfer`.
- Los montos se pueden ocultar con el ícono del ojo en el dashboard; ocultos se ven como `$ •••••`.

## Navegación
- **Mobile:** tab bar inferior con Inicio, Movimientos, [FAB +] central, Recurrentes y Más (Cuentas, Categorías, Reportes, Ajustes).
- **Web (≥ 1024 px):** sidebar fija a la izquierda con las mismas secciones y el botón "Nuevo movimiento" arriba. El contenido usa un ancho máximo de 1200 px.

## Pantallas

**Inicio**
1. Card de patrimonio con el monto en estilo display, la moneda base y la variación contra el mes anterior.
2. Carrusel horizontal de cuentas: cards de 160 px de ancho con ícono, nombre y saldo. En web se muestra como grilla.
3. "Este mes": barra doble de ingresos vs. gastos con el neto, y el top 3 de categorías con mini barra de progreso.
4. "Próximos vencimientos": hasta 5 ítems con fecha relativa ("mañana", "en 3 días") y badge ámbar. Los vencidos van en rojo.
5. "Últimos movimientos": 5 ítems y el link "Ver todos".

**Carga rápida** (bottom sheet desde el FAB)
- Segmentado arriba: Gasto | Ingreso | Transferencia.
- Monto grande, centrado, en estilo display, con un teclado numérico propio de teclas grandes (coma decimal y borrar).
- Fila de chips con la cuenta (la última usada), la fecha ("Hoy" por defecto) y la nota opcional.
- Grilla de las 8 categorías más usadas más "Ver todas". Tocar una categoría guarda el movimiento si ya hay monto.
- Al guardar: feedback háptico, el sheet se cierra y aparece un snackbar "Gasto guardado · Deshacer" durante 5 s.
- En web es un modal centrado y se puede usar todo con el teclado (Enter guarda).

**Movimientos**
- Lista agrupada por día, con header sticky que muestra la fecha y el neto del día.
- Cada ítem muestra el ícono de categoría en un círculo tintado, la descripción o categoría, la cuenta en caption y el monto alineado a la derecha.
- Filtros como chips arriba (período, cuenta, categoría, tipo) y búsqueda.
- Swipe a la izquierda para anular, con confirmación y opción de deshacer; tocar el ítem abre el detalle o la edición.
- **Web:** tabla con columnas ordenables y panel de detalle a la derecha.

**Recurrentes**
- Tabs: Pendientes | Reglas.
- Cada pendiente muestra nombre, vencimiento, monto esperado y los botones "Confirmar" y "Omitir". "Confirmar" abre un sheet para ajustar el monto si la regla tiene `is_estimate`.

**Detalle de cuenta**
- Saldo grande, mini gráfico de línea con el saldo de los últimos 6 meses y la lista de movimientos de la cuenta.

## Estados y movimiento
- **Vacío:** ilustración simple de línea, una frase y un botón de acción ("Creá tu primera cuenta").
- **Cargando:** skeletons con la forma del contenido, nunca spinners a pantalla completa.
- **Error:** mensaje claro y botón "Reintentar".
- **Offline:** banner discreto ("Sin conexión · 2 movimientos pendientes de sincronizar") e ícono de nube en los ítems no sincronizados.
- **Animaciones:** 150–200 ms con ease-out, solo para sheets, snackbars y cambios de estado. Respetar "reducir movimiento" del sistema.

# Funcionalidades

## MVP (fase 1)
- **Cuentas**: CRUD; tipos efectivo, banco, tarjeta de crédito, billetera digital y ahorro; moneda, saldo inicial, color e ícono; archivar sin perder el historial.
- **Categorías**: jerárquicas (categoría y subcategoría), separadas por tipo (gasto/ingreso), con un set por defecto editable (Supermercado, Comida afuera, Transporte, Combustible, Vivienda, Servicios, Salud, Educación, Ocio, Ropa, Suscripciones, Otros; ingresos: Sueldo, Freelance, Otros).
- **Gastos e ingresos**: monto, fecha, cuenta, categoría, descripción, etiquetas y nota opcional.
- **Transferencias**: entre cuentas propias, con soporte de moneda distinta y comisión opcional (que se registra como gasto aparte).
- **Gastos fijos / recurrentes**: plantilla con monto (fijo o estimado), frecuencia, día de vencimiento, cuenta y categoría.
  - Generan "ocurrencias pendientes" que confirmo con un toque, pudiendo ajustar el monto real.
  - Vista "Próximos vencimientos" (los próximos 30 días) y alerta de los vencidos sin pagar.
  - También aplica a ingresos recurrentes, como el sueldo.
- **Dashboard**: lo que se describe en la pantalla Inicio.
- **Listado de movimientos**: filtros por fecha, cuenta, categoría, tipo, etiqueta y texto, con paginación del lado del servidor (keyset) y scroll infinito en mobile.
- **Cotizaciones**: carga manual del tipo de cambio.

## Fase 2
- **Presupuestos** mensuales por categoría, con barra de progreso y alerta al llegar al 80% y al 100%.
- **Tarjetas de crédito**: fecha de cierre y de vencimiento, resumen del período, pago de la tarjeta como transferencia desde una cuenta bancaria, y compras en cuotas.
- **Reportes**: evolución mensual, gasto por categoría (dona y barras), comparación contra el mes anterior y flujo de caja proyectado usando los recurrentes.
- **Conciliación**: ingreso el saldo real de una cuenta, la app muestra la diferencia y me deja crear un ADJUSTMENT.
- **Importar y exportar** CSV, con mapeo de columnas y detección de duplicados.
- **Adjuntos**: foto del ticket con la cámara del celular, asociada a un movimiento.

## Fase 3 (opcional)
- Metas de ahorro asociadas a una cuenta.
- Reglas automáticas, por ejemplo: "si la descripción contiene X, asignar la categoría Y".
- Cotización automática del dólar desde una API pública.
- Notificaciones push de vencimientos (expo-notifications) y widget de carga rápida.
- Desbloqueo con biometría (expo-local-authentication).

# Entregables, en este orden
1. Migraciones Flyway del modelo de fase 1, el diagrama ER en Mermaid y el seed de categorías y monedas.
2. Contrato de la API en OpenAPI: endpoints REST con request y response de ejemplo y códigos de error, con formato de error uniforme (RFC 7807).
3. Estructura del monorepo (`apps/mobile-web`, `apps/api` y `packages/shared` para tipos y esquemas Zod) y estructura por feature dentro de cada app.
4. Theme: archivo de tokens (colores light/dark, tipografía, espaciado, radios) conectado a NativeWind, y los componentes base: Button, Card, Chip, AmountText, ListItem, BottomSheet, EmptyState, Skeleton y Snackbar.
5. Implementación del MVP, módulo por módulo, con tests de las reglas de dominio. Como mínimo hay que testear la atomicidad de las transferencias, el cálculo de saldo, la generación de ocurrencias recurrentes (incluido el caso del día 31) y la idempotencia de la sincronización offline.
6. README con instrucciones para levantar el backend con Docker y la app con `npx expo start` (mobile y web).

# Forma de trabajo
- Arrancá por los entregables 1 y 2, mostrámelos y esperá mi OK antes de seguir.
- Si una decisión de diseño tiene trade-offs, planteá las opciones en 2-3 líneas y recomendá una.
- No inventes requisitos: si algo es ambiguo, preguntá.
