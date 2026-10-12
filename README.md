# Workshop · ¿Qué tarea te gustaría delegar?

Dinámica en vivo: las personas escanean un QR, mandan una tarea desde el celular y aparece al instante en la pantalla proyectada, con un cronómetro de 2 minutos.

Stack: Next.js 16 (export estático) + Tailwind CSS 4 + Supabase (Postgres + Realtime). No necesita servidor: se publica como sitio estático.

## Rutas

| Ruta | Para qué |
| --- | --- |
| `/participar` | Formulario mobile (destino del QR) |
| `/casos` | Pantalla para proyectar: casos en tiempo real + cronómetro |
| `/casos?admin=CLAVE` | Lo mismo en modo moderador (seleccionar, ocultar, reiniciar) |
| `/qr` | QR descargable (PNG/SVG) hacia `/participar` |

Atajos en `/casos`: **Espacio** inicia/pausa el cronómetro, **S** alterna entre todos los casos y los seleccionados, **Esc** vuelve.
El cronómetro se sincroniza entre todas las pantallas `/casos` abiertas.

## 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Abrí [`supabase/schema.sql`](supabase/schema.sql) y reemplazá `cambiar-esta-clave` por tu clave de moderador.
3. Pegalo completo en **SQL Editor** y ejecutalo.
4. Ejecutá también [`supabase/002_ocupacion_y_contactos.sql`](supabase/002_ocupacion_y_contactos.sql). Agrega el campo "¿A qué te dedicás?" y la tabla privada de contactos, y no toca la clave de moderador.
5. En **Project Settings → API** copiá la *Project URL* y la clave *anon / publishable*.

**Contactos para enviar la solución por privado:** se guardan en la tabla `workshop_contacts` (nombre, teléfono, mail, rubro y caso detallado). Desde la web solo se pueden **enviar**, nunca leer. Los ves en Supabase → **Table Editor → workshop_contacts**.

## 2. Configuración

Hay dos formas. Usá una de las dos:

- **`public/config.js`** (o `config.js` dentro del zip / carpeta `out`): completá `supabaseUrl` y `supabaseAnonKey`. Se puede editar después del build.
- **Variables de entorno al compilar** (ideal con GitHub): ver [`.env.example`](.env.example).

`sessionId` identifica al evento (ej. `workshop-corrientes-2026`). Para otro workshop, cambialo.
`siteUrl` puede quedar vacío: el QR usa el dominio donde esté publicado el sitio.

## 3. Deploy en GitHub Pages (solo GitHub + Supabase)

1. Creá un repositorio en GitHub (público si usás el plan gratis) y subí este proyecto a la rama `main`.
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions → pestaña Variables → New repository variable**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_WORKSHOP_SESSION_ID` (opcional)
4. **Actions → Deploy a GitHub Pages → Run workflow** (después se publica solo en cada push).
5. Queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`. El QR está en `.../NOMBRE-DEL-REPO/qr`.

El workflow está en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## 3b. Alternativa: Cloudflare Pages

**Opción A: subir el zip (sin GitHub)**

1. `npm install` y `npm run build`. Se genera la carpeta `out/`.
2. Completá `out/config.js` con tus datos de Supabase.
3. Comprimí el **contenido** de `out/` en un zip. En Windows:
   `Compress-Archive -Path out\* -DestinationPath workshop-cloudflare.zip -Force`
4. En dash.cloudflare.com: **Workers & Pages → Create → Pages → Upload assets**, y subí el zip (o arrastrá la carpeta `out`).

**Opción B: conectar GitHub**

1. Subí el repo a GitHub.
2. En Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
3. Build command: `npm run build`. Build output directory: `out`.
4. En *Environment variables* cargá `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_WORKSHOP_SESSION_ID`.

Después del deploy: abrí `https://TU-SITIO/qr`, descargá el PNG y ponelo en la presentación.

## Seguridad

- Las personas que participan solo pueden **insertar** casos y **leer** los visibles. Lo aplica la RLS de Supabase, con límites de largo en la base.
- Seleccionar, ocultar y reiniciar usan funciones SQL que verifican la clave de moderador, guardada hasheada en una tabla que no se puede leer desde el navegador. La clave nunca está en el código publicado y se quita de la URL al entrar.
- "Reiniciar dinámica" es un *soft reset*: archiva los casos de la sesión actual. No se borra nada.
- La clave anon de Supabase es pública por diseño. La seguridad está en las políticas RLS.

## Desarrollo local

```bash
npm install
npm run dev
```
