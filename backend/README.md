# Backend

Este backend está preparado para conectarse a Supabase como base de datos PostgreSQL usando Prisma.

## Configuración

1. Copia `backend/.env.example` a `backend/.env`.
2. Reemplaza `YOUR_PROJECT_REF` por el ref real de tu proyecto de Supabase.
3. Pon la contraseña correcta del usuario de base de datos que te da Supabase.
4. Ejecuta:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Verificación

- `GET /health` responde si el servidor está arriba.
- `GET /db-check` prueba la conexión a la base de datos de Supabase.

## Cambios recientes (Prisma 7 + Supabase)

Este bloque resume los ajustes realizados para dejar la conexión estable y versionada.

### 1) Configuración de Prisma 7

- Se actualizó `prisma.config.ts` para usar opciones válidas en Prisma 7.
- Se eliminó el uso de `earlyAccess` y `migrate` (ya no aplican en esta versión).
- Se configuró `datasource.url` usando `DATABASE_URL` desde variables de entorno.
- Se agregó carga explícita de entorno con `dotenv/config`.

### 2) Cliente Prisma en runtime

- Se ajustó `src/lib/prisma.js` para inicializar `PrismaClient` con `@prisma/adapter-pg`.
- Esto es necesario en Prisma 7 para conexión directa con PostgreSQL/Supabase en runtime.
- Se exporta `prisma` como named export y default export para compatibilidad.

### 3) Esquema Prisma

- Se corrigió un `generator client` duplicado en `prisma/schema.prisma`.
- El datasource en schema quedó solo con `provider = "postgresql"` (en Prisma 7, `url/directUrl` se gestionan desde configuración/cliente).

### 4) Migraciones (baseline)

- Se creó la migración base en `prisma/migrations/0001_init/migration.sql`.
- La migración se marcó como aplicada (`migrate resolve`) para no recrear tablas existentes.
- Estado actual: esquema en base de datos sincronizado y migraciones habilitadas para cambios futuros.

### 5) Comandos de validación usados

```bash
npx prisma validate
npm run prisma:generate
npx prisma db push
npx prisma migrate status
```

Además, se validó API y DB:

```bash
GET /health
GET /db-check
```

### 6) Flujo recomendado a partir de ahora

Para cada cambio de modelos:

```bash
npx prisma migrate dev --name descripcion_del_cambio
npm run prisma:generate
```

En despliegue/producción:

```bash
npx prisma migrate deploy
```
