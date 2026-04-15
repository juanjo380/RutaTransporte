# RutaTransporte

RutaTransporte es una plataforma de gestion de transporte universitario para coordinar rutas, horarios y reservas entre estudiantes, administradores y conductores.

El repositorio esta dividido en dos aplicaciones principales:

- [frontend](frontend): interfaz web en Next.js 16, React 19 y TypeScript.
- [backend](backend): API en Express 5 con Prisma 7 y PostgreSQL en Supabase.

## Objetivo funcional

La aplicacion cubre este flujo:

- El estudiante consulta horarios, reserva cupos y administra sus reservas.
- El administrador supervisa la operacion, visualiza metricas y asigna conductores.
- El conductor revisa sus rutas, horarios y pasajeros asignados.

## Estado actual

- La autenticacion ya esta conectada al backend con JWT.
- El resto de la experiencia de negocio sigue usando datos simulados en memoria.
- El backend expone auth y verificaciones de salud; los modulos de reservas, horarios y administracion estan previstos en la estructura, pero aun no tienen endpoints publicos implementados.

## Estructura del proyecto

```text
RutaTransporte/
├── backend/
│   ├── server.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── utils/
│       └── lib/
├── frontend/
│   └── src/app/
│       ├── context/
│       ├── pages/
│       ├── components/
│       └── styles/
└── supabase/
	└── config.toml
```

## Frontend

El frontend vive en [frontend](frontend) y funciona como la capa de experiencia de usuario.

Puntos clave:

- Navegacion con react-router-dom dentro de Next.js.
- Rutas principales: /login, /, /student, /admin y /driver.
- Autenticacion basada en contexto, con sesion persistida en localStorage y consumo del backend mediante NEXT_PUBLIC_API_URL.
- Estilos globales y tema centralizados en `src/app/globals.css`, `src/app/styles/theme.css` y `src/app/context/theme-context.tsx`.
- Componentes de UI basados en Radix UI, estilo shadcn/ui, Tailwind CSS y sonner para notificaciones.

Pantallas principales:

- Login
- StudentHome
- AdminDashboard
- DriverView

## Backend

El backend vive en [backend](backend) y expone la API del sistema.

Tecnologias:

- Express 5
- Prisma 7
- `@prisma/adapter-pg`
- PostgreSQL en Supabase
- bcryptjs, jsonwebtoken y cors

Modelo de datos:

- Usuario
- Ruta
- Horario
- Reserva
- enums Rol y EstadoReserva

Flujo de autenticacion:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

El backend firma JWT con JWT_SECRET y guarda contrasenas con bcrypt. Los roles del API son student, driver y admin, y se mapearon al esquema de base de datos como ESTUDIANTE, CONDUCTOR y ADMIN.

Endpoints de verificacion:

- GET /health
- GET /db-check

## Variables de entorno

### Backend

Crea `backend/.env` a partir de `backend/.env.example`:

```env
DATABASE_URL="postgresql://postgres:password@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:password@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
JWT_SECRET="change_me_super_secret"
JWT_EXPIRES_IN="7d"
```

### Frontend

Si el frontend necesita apuntar a otro backend, define:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

Si no se define, el frontend usa `http://localhost:5000` por defecto.

## Instalacion y ejecucion

### 1. Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Abrir la aplicacion

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health check: http://localhost:5000/health
- DB check: http://localhost:5000/db-check

## Scripts utiles

### backend

- `npm run dev`: inicia la API en modo desarrollo.
- `npm run start`: inicia la API sin watch.
- `npm run prisma:generate`: genera el cliente de Prisma.
- `npm run prisma:migrate`: aplica migraciones locales.
- `npm run prisma:studio`: abre Prisma Studio.

### frontend

- `npm run dev`: inicia la app en desarrollo.
- `npm run build`: compila la app para produccion.
- `npm run start`: ejecuta el build compilado.

## Documentacion adicional

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

## Notas de desarrollo

- El proyecto esta pensado para evolucionar de un prototipo funcional a una integracion completa con persistencia y flujos operativos reales.
- Si cambias el esquema de Prisma, genera una nueva migracion y vuelve a correr `npm run prisma:generate`.
- Si cambias el puerto o el origen permitido del backend, revisa `CORS_ORIGIN` y `NEXT_PUBLIC_API_URL`.
