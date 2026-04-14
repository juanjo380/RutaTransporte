# Frontend - RutaTransporte

Este directorio contiene la interfaz web de RutaTransporte, la plataforma de gestión de transporte universitario. El frontend está construido con Next.js, React y TypeScript, y combina componentes de Radix UI con patrones tipo shadcn/ui para mantener una base accesible, consistente y fácil de extender.

La aplicación usa Next.js como contenedor, pero la navegación funcional se resuelve con `react-router-dom` dentro de un router centralizado. Eso permite simular hoy un flujo completo de producto sin depender de la navegación nativa de App Router.

## Objetivo

La experiencia está pensada para tres perfiles operativos:

- Estudiante: consulta horarios, reserva cupos y administra sus reservas.
- Administrador: visualiza métricas, asigna conductores y controla el estado general.
- Conductor: revisa su agenda, rutas asignadas y pasajeros por viaje.

La app funciona actualmente con datos mockeados en memoria, por lo que sirve como prototipo funcional de extremo a extremo mientras el backend termina de integrarse.

## Stack Principal

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- react-router-dom
- Radix UI y componentes base estilo shadcn/ui
- lucide-react para iconografía
- sonner para notificaciones
- next-themes para sincronizar el estado visual de las notificaciones con el tema activo

## Arquitectura Del Frontend

La estructura principal vive en `src/app`:

- `App.tsx`: ensambla los providers globales, crea el router y monta el toaster global.
- `routes.tsx`: define rutas públicas, privadas y redirecciones por rol.
- `layout.js`: configura metadata, fuentes tipográficas y clases raíz del documento.
- `globals.css`: entrada real de estilos globales, importación del sistema de tema y normalización visual.
- `context/`: providers de autenticación y tema.
- `pages/`: pantallas principales del producto.
- `components/`: componentes funcionales reutilizables.
- `components/ui/`: librería base de interfaz.
- `styles/`: tokens visuales, fuentes auxiliares y reglas compartidas.

## Navegación Y Acceso

La navegación principal se define en `src/app/routes.tsx`.

Rutas relevantes:

- `/login`: acceso al sistema.
- `/`: redirección según el rol autenticado.
- `/student`: panel del estudiante.
- `/admin`: panel del administrador.
- `/driver`: panel del conductor.
- `*`: fallback hacia la raíz.

Las rutas protegidas usan `ProtectedRoute` para validar sesión y rol. `RoleBasedRedirect` distribuye a cada usuario en su panel correspondiente sin duplicar lógica en las vistas.

## Autenticación Y Roles

La autenticación está implementada en `src/app/context/auth-context.tsx`.

Características actuales:

- Usa usuarios mockeados en memoria.
- Expone login, logout, usuario actual y estado de autenticación.
- Soporta los roles `student`, `admin` y `driver`.
- El conductor incluye `driverId` para asociarlo a sus rutas.

Esto todavía no está conectado a un backend real, así que el login funciona como simulador de producto y no como autenticación de producción.

## Tema Visual

El tema global se controla desde `src/app/context/theme-context.tsx`.

Comportamiento:

- Persiste la preferencia en `localStorage`.
- Alterna entre `light` y `dark`.
- Aplica o elimina la clase `dark` en el elemento raíz del documento.
- Permite que toda la interfaz consuma variantes de Tailwind compatibles con tema oscuro.

## Sistema Visual Y Colorimetría

La interfaz usa un lenguaje visual sobrio, institucional y orientado a operación. La intención no es decorativa, sino funcional: que la lectura de estados, rutas y reservas sea inmediata.

### Principios

- Un solo sistema de tokens para superficies, bordes, texto y acciones.
- Evitar colores hardcoded en componentes nuevos.
- Priorizar contraste, legibilidad y separación clara entre estados.
- Mantener una identidad profesional en light y dark mode.

### Paleta Semántica

| Token | Uso | Intención |
| --- | --- | --- |
| `background` | lienzo principal | superficie neutra para toda la app |
| `card` | tarjetas y paneles | contenedores limpios y legibles |
| `primary` | acción principal | azul institucional con presencia clara |
| `secondary` | apoyo visual | variación suave para superficies y chips |
| `muted` | texto secundario | jerarquía de información sin ruido |
| `accent` | énfasis secundario | resaltado controlado para bloques informativos |
| `destructive` | cancelaciones y alertas | rojo de acción, no decorativo |
| `sidebar` | navegación | contraste estable para navegación |
| `chart-*` | gráficos y métricas | paleta analítica consistente |

### Tipografía

- `Geist Sans` se usa como fuente principal de interfaz.
- `Geist Mono` se reserva para datos técnicos, valores numéricos o elementos que requieran alineación monoespaciada.
- Las reglas base de encabezados y controles viven en `src/app/styles/theme.css`.

## Pantallas Principales

### Login

`src/app/pages/login.tsx` contiene el acceso al sistema.

Incluye:

- selector de tema,
- formulario de email y contraseña,
- feedback de error,
- credenciales de prueba,
- branding visual de la plataforma.

### Estudiante

`src/app/pages/student-home.tsx` concentra la experiencia del estudiante.

Incluye:

- listado de horarios disponibles,
- diálogo para solicitar cupo,
- pestañas de reservas activas,
- cancelación de reservas,
- notificaciones toast,
- selector de tema y salida de sesión.

### Administrador

`src/app/pages/admin-dashboard.tsx` expone la vista operativa.

Incluye:

- métricas de reservas y estudiantes únicos,
- matriz de horarios,
- asignación de conductores a rutas,
- agrupación de reservas,
- tarjetas y filtros de gestión.

### Conductor

`src/app/pages/driver-view.tsx` presenta la agenda del conductor.

Incluye:

- información del conductor,
- horarios asignados,
- listado de pasajeros por ruta,
- resumen operativo por horario,
- datos mockeados para simulación.

## Componentes Reutilizables

### Lógica De Acceso

- `components/protected-route.tsx`: bloquea el acceso si no hay sesión o si el rol no coincide.
- `components/role-based-redirect.tsx`: envía al usuario a su panel según rol.

### Reserva Y Horarios

- `components/bus-schedule-card.tsx`: tarjeta de horario con ocupación, conductor y acción principal.
- `components/reservation-dialog.tsx`: modal para completar una reserva.
- `components/my-reservations.tsx`: lista de reservas activas del estudiante.
- `components/driver-profile.tsx`: perfil resumido del conductor.

### UI Base

La carpeta `components/ui/` contiene los bloques visuales reutilizables del sistema:

- `button`, `card`, `badge`, `dialog`, `input`, `label`, `tabs`, `select`, `toast`, entre otros.

Estos bloques actúan como base de toda la interfaz y deben mantenerse alineados con los tokens globales del tema.

## Estilos Y Configuración Visual

La documentación de estilos se concentra en estos archivos:

- `src/app/globals.css`
- `src/app/styles/theme.css`
- `src/app/styles/fonts.css`
- `src/app/layout.js`

### `globals.css`

Es la hoja global activa. Define la entrada de Tailwind, importa los estilos de fuente y tema, y aplica la capa visual base del documento.

### `theme.css`

Contiene el sistema de diseño principal mediante variables CSS:

- colores base: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent` y `destructive`,
- bordes, inputs, ring y estados,
- radios de borde,
- colores de sidebar,
- paleta de charts,
- variantes para modo claro y oscuro,
- reglas base para jerarquía tipográfica.

### `fonts.css`

Queda como archivo auxiliar para tipografías adicionales o reglas de font-face si el proyecto lo requiere más adelante.

### `layout.js`

Carga las fuentes de Google `Geist` y `Geist Mono`, define la metadata base y marca el documento con la configuración de idioma y clases raíz.

## Convenciones De Desarrollo

- Usar tokens CSS o utilidades de Tailwind para los colores, no valores arbitrarios.
- Mantener la lógica de tema en el provider global, no en cada pantalla.
- Sincronizar documentación y variables visuales cuando cambie la paleta.
- Conservar la separación entre vistas de negocio y componentes de presentación.
- Evitar duplicar reglas de estilo que ya estén en `theme.css`.

## Datos Mockeados

La aplicación sigue funcionando con datos locales definidos en componentes o contexto.

Ejemplos:

- usuarios de prueba en el auth context,
- horarios en la vista del estudiante,
- reservas de ejemplo en el panel administrativo,
- horarios y pasajeros del conductor.

Esto permite probar el flujo completo sin depender del backend.

## Dependencias Relevantes

- `react-router-dom` para navegación.
- `sonner` para notificaciones.
- `lucide-react` para iconos.
- `next-themes` para que las notificaciones respeten el tema activo.
- `@radix-ui/*` para componentes accesibles.
- `tailwind-merge`, `clsx` y `class-variance-authority` para composición de clases.

## Scripts Disponibles

Desde esta carpeta se pueden ejecutar estos comandos:

- `npm run dev`: inicia el entorno de desarrollo.
- `npm run build`: genera el build de producción.
- `npm run start`: levanta la aplicación ya compilada.

## Notas Importantes

- La app mezcla Next.js con `react-router-dom`; es correcto para este prototipo, pero conviene revisarlo si más adelante se migra a navegación nativa de Next.
- La autenticación todavía es mock, así que las credenciales solo sirven para desarrollo.
- La base de estilos debe mantenerse alineada con `theme.css`, porque ahí vive el sistema cromático y la mayor parte de la coherencia visual.

## Evolución Recomendada

Si el frontend se lleva a producción, los siguientes pasos lógicos serían:

- conectar autenticación real con backend,
- persistir reservas y horarios,
- mover datos mock a servicios o API,
- centralizar tipos compartidos,
- documentar variables de entorno si se agregan integraciones externas.
