# JWT y Timeout por Inactividad

## ¿Qué es JWT (JSON Web Token)?

JWT es un estándar de seguridad para autenticación sin estado en aplicaciones web.

### Estructura básica
Un JWT consta de 3 partes separadas por puntos (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1MiIsImVtYWlsIjoiYWRtaW5AcnV0YS5jb20iLCJyb2xlIjoiQURNSU4ifQ.xK3N...
|                    |                                                          |
Header              Payload                                                  Signature
```

**Header**: Tipo de token y algoritmo de cifrado (HS256)
**Payload**: Datos del usuario (id, email, rol)
**Signature**: Firma digital usando `JWT_SECRET` (solo el servidor puede crear/validar)

### Cómo funciona en RutaTransporte

1. **Usuario hace login** con email y contraseña
2. **Backend verifica credenciales** contra la BD
3. **Backend crea JWT** con: `{ sub: userId, email, role }`
4. **Token se devuelve** al frontend
5. **Frontend guarda token** en localStorage
6. **Frontend envía token** en header `Authorization: Bearer <token>` en cada request
7. **Backend valida token** comparando firma con `JWT_SECRET`

### Ventajas

- ✅ Sin estado en servidor (stateless) → más escalable
- ✅ Seguro: imposible falsificar sin `JWT_SECRET`
- ✅ Portable: funciona en móvil, web, desktop
- ✅ Expiración automática: token se invalida tras N minutos

## Configuración en RutaTransporte

### Variables de entorno

```env
JWT_SECRET="ruta-transporte-univ-buga-tulua-2026-$uP3rS3cr3t"
JWT_EXPIRES_IN="1h"
JWT_INACTIVITY_TIMEOUT=900000
```

**JWT_SECRET**: Clave secreta única del proyecto
- Cambia en producción a valor aleatorio fuerte
- NO compartir en repos públicos

**JWT_EXPIRES_IN**: Tiempo máximo de vida del token
- Actual: `1h` (1 hora)
- Opciones: `15m`, `7d`, `30d`, etc.

**JWT_INACTIVITY_TIMEOUT**: Tiempo sin actividad antes de logout (en ms)
- Actual: `900000` = 15 minutos
- Usado por frontend, no backend

## Timeout por Inactividad (Nuevo)

### ¿Por qué?
Un usuario puede tener el navegador abierto sin hacer nada. El JWT sigue siendo válido 1 hora.  
Con inactividad se cierra la sesión automáticamente si el usuario no interactúa.

### Implementación

**Frontend** ([frontend/src/app/context/auth-context.tsx](auth-context.tsx)):

```typescript
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

useEffect(() => {
  if (!user) return;

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      // Logout silencioso después de 15 min sin actividad
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    }, INACTIVITY_TIMEOUT);
  };

  // Escuchar eventos de actividad
  const activityEvents = ["click", "keypress", "mousemove", "touchstart"];
  activityEvents.forEach((event) => {
    window.addEventListener(event, resetInactivityTimer, true);
  });

  resetInactivityTimer(); // Iniciar timer

  return () => {
    // Limpiar listeners
  };
}, [user]);
```

### Eventos que resetean el timer
- **click**: mouse click
- **keypress**: teclado
- **mousemove**: movimiento de mouse
- **touchstart**: toque en pantalla

### Flujo

```
Usuario inicia sesión
    ↓
[Timer de 15 min inicia]
    ↓
¿Usuario hace click/teclea/toca?
    ├─ Sí → [Timer se resetea a 15 min] (regresa a inicio)
    └─ No → [Pasa 1 minuto] → [¿Contador completó 15 min?]
                                ├─ No → [Esperar más]
                                └─ Sí → [Logout silencioso] → [Redirige a login]
```

## Cambios implementados

### Backend
- **Archivo**: [backend/.env](../.env)
- Nuevas variables de configuración JWT
- Secret específico para RutaTransporte
- Duración ajustada a 1 hora

### Backend (Referencia)
- **Archivo**: [backend/.env.example](.env.example)
- Template actualizado para documentar parámetros

### Frontend
- **Archivo**: [frontend/src/app/context/auth-context.tsx](../../frontend/src/app/context/auth-context.tsx)
- Lógica de monitoreo de inactividad
- Logout automático silencioso
- Cleanup de listeners y timers

## Pruebas

### Test 1: Inactividad
1. Inicia sesión
2. Espera 15 minutos sin tocar nada
3. Token debe limpiarse automáticamente
4. Redirige a login

### Test 2: Actividad continua
1. Inicia sesión
2. Cada 10 minutos: haz click o busca algo
3. Sesión nunca expira por inactividad
4. Solo JWT expira si pasa 1 hora total

### Test 3: Validación de token
1. Inicia sesión
2. Abre DevTools → Application → localStorage
3. Copia el token
4. Cierra sesión
5. Pega token en nuevamente
6. Intenta autorizado → debe rechazar si expiró

## Seguridad

### ✅ Buenas prácticas implementadas
- JWT con firma HMAC-SHA256
- Expiración automática de token
- Inactividad monitoreada
- Token en localStorage (accesible por JavaScript)

### ⚠️ Mejoras futuras
- Migrar token a **cookie httpOnly** (no accesible por JavaScript, más seguro ante XSS)
- Implementar **refresh token** (token corto + refresh automático)
- Validar CORS en backend
- HTTPS obligatorio en producción

## Comandos útiles

### Ver token en navegador (DevTools)
```javascript
// Paste en Console
localStorage.getItem('ruta_transporte_token')
```

### Decodificar JWT (en DevTools)
```javascript
// Paste en Console
JSON.parse(atob(token.split('.')[1]))
// Resultado: { sub: 'u2', email: 'admin@ruta.com', role: 'ADMIN' }
```

### Verificar expiración
```javascript
const token = localStorage.getItem('ruta_transporte_token');
const payload = JSON.parse(atob(token.split('.')[1]));
const expiresAt = new Date(payload.exp * 1000);
console.log('Token expira:', expiresAt);
```

## Referencias

- [JWT.io](https://jwt.io) - Herramienta interactiva para JWT
- [Auth0 JWT Introduction](https://auth0.com/intro-to-iam/what-is-jwt)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
