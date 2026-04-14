# Frontend - Ruta Universitaria

Este directorio contiene el front de la plataforma de transporte universitario. La aplicación está construida con Next.js, React, TypeScript y una capa de componentes basada en shadcn/ui y Radix UI. Aunque usa la estructura de Next, la navegación principal se resuelve con `react-router-dom` a través de un router centralizado.

## Propósito

El front simula el flujo completo de la plataforma para tres perfiles:

- Estudiante: consulta horarios, reserva cupos y revisa sus reservas.
- Administrador: visualiza métricas, reservas y asignación de conductores.
- Conductor: consulta sus rutas y los pasajeros asignados.

La app está pensada como prototipo funcional con datos mockeados en memoria. No depende todavía de un backend real para autenticación ni persistencia de reservas.

## Stack principal

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- react-router-dom
- lucide-react para iconografía
- sonner para notificaciones
- next-themes y contexto propio para tema visual
- componentes base tipo shadcn/ui sobre Radix UI

## Scripts disponibles

Desde esta carpeta se pueden ejecutar estos comandos:

- `npm run dev`: inicia el entorno de desarrollo.
- `npm run build`: genera el build de producción.
- `npm run start`: levanta la aplicación ya compilada.

## Estructura general

La organización principal vive en `src/app`:

- `App.tsx`: punto de entrada visual del front. Envuelve la app con los providers de tema y autenticación, renderiza el router y el toaster global.
- `routes.tsx`: define las rutas públicas y protegidas.
- `layout.js`: layout raíz de Next, metadata general y carga de fuentes.
- `globals.css`: archivo global de estilos, variables y tema.
- `context/`: providers globales para autenticación y tema.
- `pages/`: pantallas principales de la aplicación.
- `components/`: componentes reutilizables del UI y piezas funcionales.
- `components/ui/`: biblioteca de componentes base de interfaz.
- `styles/`: estilos auxiliares y variables visuales.

## Flujo de navegación

La navegación se resuelve en `src/app/routes.tsx`.

Rutas principales:

- `/login`: pantalla de acceso.
- `/`: redirección según el rol del usuario autenticado.
- `/student`: vista del estudiante.
- `/admin`: panel administrativo.
- `/driver`: panel del conductor.
- `*`: redirección a la raíz.

Las rutas privadas están protegidas con `ProtectedRoute`, que valida autenticación y rol.
`RoleBasedRedirect` envía cada usuario a su panel correspondiente.

## Autenticación y roles

La autenticación vive en `src/app/context/auth-context.tsx`.

Características actuales:

- Usa usuarios mockeados en memoria.
- Maneja login, logout, usuario actual y estado de autenticación.
- Soporta tres roles: `student`, `admin` y `driver`.
- El conductor incluye `driverId` para asociarlo a sus rutas.

Importante: esto todavía no está conectado a un backend real, así que el login sirve como prototipo funcional.

## Tema visual

El cambio de tema se controla desde `src/app/context/theme-context.tsx`.

Comportamiento:

- Guarda el tema en `localStorage`.
- Alterna entre `light` y `dark`.
- Agrega o quita la clase `dark` en el elemento raíz del documento.
- Permite que los componentes usen clases Tailwind con variantes oscuras.

## Pantallas principales

### Login

`src/app/pages/login.tsx` muestra el formulario de acceso.

Incluye:

- selector de tema,
- formulario de email y contraseña,
- mensajes de error,
- tarjetas con credenciales de prueba,
- identidad visual de la plataforma.

### Estudiante

`src/app/pages/student-home.tsx` concentra la experiencia del estudiante.

Incluye:

- listado de horarios disponibles,
- diálogo para solicitar cupo,
- pestaña de reservas activas,
- cancelación de reservas,
- notificaciones toast al confirmar o cancelar,
- selector de tema y salida de sesión.

### Administrador

`src/app/pages/admin-dashboard.tsx` muestra una vista operativa del sistema.

Incluye:

- métricas de reservas y estudiantes únicos,
- matriz de horarios,
- asignación de conductores a rutas,
- consulta de reservas agrupadas,
- tarjetas y filtros de gestión.

### Conductor

`src/app/pages/driver-view.tsx` presenta la agenda del conductor.

Incluye:

- información del conductor,
- horarios asignados,
- lista de pasajeros por ruta,
- vista resumida por horario,
- datos mockeados para simulación.

## Componentes reutilizables

### Lógica de acceso

- `components/protected-route.tsx`: bloquea acceso si no hay sesión o si el rol no coincide.
- `components/role-based-redirect.tsx`: manda al usuario a su panel según rol.

### Reserva y horarios

- `components/bus-schedule-card.tsx`: tarjeta visual de cada horario con ocupación, conductor y acción de reserva.
- `components/reservation-dialog.tsx`: formulario modal para completar la reserva.
- `components/my-reservations.tsx`: lista de reservas activas del estudiante.
- `components/driver-profile.tsx`: perfil resumido del conductor usado en varias vistas.

### UI base

La carpeta `components/ui/` contiene los bloques visuales reutilizables del sistema:

- `button`, `card`, `badge`, `dialog`, `input`, `label`, `tabs`, `select`, `toast`, entre otros.

Estos componentes funcionan como base de toda la interfaz y permiten mantener consistencia visual.

## Estilos y configuración visual

La documentación de estilos está concentrada en estos archivos:

- `src/app/globals.css`
- `src/app/styles/theme.css`
- `src/app/styles/fonts.css`
- `src/app/layout.js`

### `globals.css`

Es la hoja global principal. Define:

- importación de Tailwind,
- importación de estilos de fuente y tema,
- variables base de colores,
- soporte para modo oscuro,
- tipografía base del cuerpo.

También enlaza los tokens del tema con variables CSS para que Tailwind los consuma de forma consistente.

### `theme.css`

Define el sistema visual completo mediante variables CSS:

- colores base: background, foreground, card, accent, muted, primary,
- bordes, inputs y ring,
- radios de borde,
- colores de sidebar,
- paleta de charts,
- variantes para modo oscuro.

Además, contiene reglas base que ajustan tipografía global para elementos como `h1`, `h2`, `label`, `button` e `input`.

### `fonts.css`

Actualmente está vacío, pero ya está enlazado desde `globals.css`.
Se puede usar después para declarar fuentes personalizadas o imports tipográficos si el proyecto lo necesita.

### `layout.js`

Carga las fuentes de Google `Geist` y `Geist Mono`, define metadata base y aplica clases globales al documento.

## Convenciones de diseño

La interfaz usa una línea visual consistente basada en:

- fondos con gradientes suaves,
- tarjetas con sombras y superficies translúcidas,
- color por rol o contexto funcional,
- iconos para reforzar lectura rápida,
- estados de ocupación en horarios,
- soporte visual para dark mode.

En general, el front prioriza claridad operativa y contraste por estado, no solo estética.

## Datos mockeados

Hoy la app funciona con datos locales definidos en los propios componentes o en el contexto.

Ejemplos:

- usuarios de prueba en el auth context,
- horarios en la vista del estudiante,
- reservas de ejemplo en el panel administrativo,
- horarios y pasajeros del conductor.

Esto permite probar el flujo completo sin backend.

## Dependencias relevantes

Algunas dependencias importantes del front son:

- `react-router-dom` para navegación.
- `sonner` para notificaciones.
- `lucide-react` para iconos.
- `next-themes` para soporte de tema.
- `@radix-ui/*` para componentes accesibles.
- `tailwind-merge`, `clsx` y `class-variance-authority` para composición de clases.

## Notas importantes

- La aplicación mezcla Next.js con un router de React Router; eso es válido en este prototipo, pero conviene documentarlo si luego se migra a una navegación nativa de Next.
- La autenticación todavía es mock, así que las credenciales solo sirven para desarrollo.
- La documentación de estilos debe mantenerse alineada con `theme.css`, porque ahí vive la mayor parte del sistema visual.

## Sugerencia para evolución del proyecto

Si este front se lleva a producción, los siguientes pasos lógicos serían:

- conectar autenticación real con backend,
- persistir reservas y horarios,
- mover los datos mock a servicios o API,
- centralizar tipos compartidos,
- documentar variables de entorno si se agregan integraciones externas.
