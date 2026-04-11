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
