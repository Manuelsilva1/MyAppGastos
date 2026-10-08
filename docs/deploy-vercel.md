# Deploy de la web en Vercel

La web es un export estático de Expo (`apps/mobile-web`). La API todavía no está desplegada.

## Configuración (una sola vez)

1. En Vercel: **Add New → Project** y elegir el repo `Manuelsilva1/MyAppGastos`.
2. Dejar **Root Directory** en la raíz del repo. La configuración está en `vercel.json`:
   - Instalación desde la raíz (es un monorepo con workspaces).
   - Build: `npm run build --workspace @finanzas/mobile-web` (equivale a `expo export --platform web`).
   - Salida: `apps/mobile-web/dist`.
3. **Deploy**. Cada push a la rama genera un preview; el merge a la rama principal actualiza producción.

## Verificar en local lo mismo que hace Vercel

```bash
npm install
npm run build --workspace @finanzas/mobile-web
npx serve apps/mobile-web/dist   # o cualquier servidor estático
```

## Límites del plan gratuito (Hobby)

- Uso personal y no comercial.
- La web no tiene backend todavía: solo se ve la pantalla provisoria.
