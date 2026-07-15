# Script de Seeding de Usuarios

## ¿Qué es?

Script Node.js que carga usuarios de manera manual en la BD con contraseñas **encriptadas automáticamente**.

El script ahora lee usuarios desde archivo JSON para separar datos publicos (versionados) de datos privados (locales e ignorados por git).

Ideal para:
- Cargar datos iniciales en desarrollo
- Cargar usuarios sin usar el endpoint de registro
- Asegurar que las contraseñas estén hasheadas con bcrypt

## Usuarios precargados

| Email | Rol | Contraseña |
|-------|-----|-----------|
| juan.perez@univ.edu | ESTUDIANTE | Student123! |
| carlos.driver@univ.edu | CONDUCTOR | Driver123! |
| maria.driver@univ.edu | CONDUCTOR | Driver123! |
| admin@rutauniv.com | ADMIN | Admin123! |

Estos usuarios viven en `scripts/seed-users.public.json`.

## Uso

### Opción 1: Con npm (recomendado)

```bash
cd backend
npm run seed
```

Por defecto, `npm run seed` usa modo `upsert` (crea o actualiza).
Tambien usa por defecto `scripts/seed-users.public.json`.

Para usar un archivo privado local:

```bash
SEED_USERS_FILE=scripts/private/seed-users.private.json npm run seed
```

En PowerShell:

```powershell
$env:SEED_USERS_FILE="scripts/private/seed-users.private.json"
npm run seed
```

Tambien puedes pasarlo por argumento:

```bash
npm run seed -- --file=scripts/private/seed-users.private.json
```

### Modos disponibles

```bash
# Solo crea. Si existe email, lo omite.
npm run seed:create

# Crea si no existe y actualiza si existe.
npm run seed:upsert

# Igual que upsert, pero ademas elimina de BD los usuarios no listados en const users.
npm run seed:sync
```

Tambien puedes usar argumento directo:

```bash
node scripts/seed-users.js --mode=create
node scripts/seed-users.js --mode=upsert
node scripts/seed-users.js --mode=sync
node scripts/seed-users.js --mode=upsert --file=scripts/private/seed-users.private.json
```

### Opción 2: Con node directo

```bash
cd backend
node scripts/seed-users.js
```

## Salida esperada

```
🌱 Iniciando seeding de usuarios...

✅ Usuario creado: juan.perez@univ.edu (ESTUDIANTE)
✅ Usuario creado: carlos.driver@univ.edu (CONDUCTOR)
✅ Usuario creado: maria.driver@univ.edu (CONDUCTOR)
✅ Usuario creado: admin@rutauniv.com (ADMIN)

✨ Seeding completado
```

Si un usuario ya existe, saltará ese email:

```
⏭️  Usuario juan.perez@univ.edu ya existe, omitiendo...
```

En modo `upsert` o `sync` verás salida tipo:

```
✅ Usuario sincronizado: juan.perez@univ.edu (ESTUDIANTE)
```

## Modificar, actualizar y eliminar usuarios

Para añadir o cambiar usuarios, edita `scripts/seed-users.js`:

Para datos de ejemplo del repo, edita `scripts/seed-users.public.json`.

Para datos reales o sensibles, crea un archivo local en `scripts/private/seed-users.private.json` (esta carpeta se ignora por git).

Formato ejemplo:S

```javascript
[
  {
    nombre: "Tu Nombre",
    email: "tu.email@univ.edu",
    password: "TuContraseña123!",
    rol: "ESTUDIANTE", // ESTUDIANTE, CONDUCTOR, ADMIN
  },
  // Más usuarios...
]
```

Luego ejecuta según necesidad:

- Crear solo nuevos: `npm run seed:create`
- Crear o actualizar existentes: `npm run seed` o `npm run seed:upsert`
- Sincronizar exacto (crear, actualizar y eliminar no listados): `npm run seed:sync`

Regla importante:
- Si eliminas un usuario del array `const users`, ese usuario solo se borra de la BD al usar `npm run seed:sync`.
- Con `seed:create` o `seed:upsert` no se elimina.

## Seguridad

✅ Las contraseñas se encriptan automáticamente con bcrypt (SALT_ROUNDS=10)  
✅ No se guarda plaintext en BD  
✅ Compatible con login backend (autenticación funcional)  
✅ Idempotente: no duplica usuarios si ya existen  
✅ Modos flexibles para create, upsert y sync  
✅ Soporta archivo privado local de seed para no versionar datos reales  

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
npm install
```

### Error: "connection refused"

Asegúrate que:
- `.env` tiene `DATABASE_URL` correcto
- Supabase está disponible y accesible
- Red permite conexión a `db.uwrkcfxarfsfpifxeols.supabase.co`

### Error: "usuario table does not exist"

Corre migraciones primero:

```bash
npx prisma migrate deploy
```

## Alternativa manual (sin script)

Si quieres usar PowerShell en lugar de seed:

```powershell
$baseUrl = "http://localhost:5000/api/auth"
$student = @{
    name = "Juan Pérez"
    email = "juan.perez@univ.edu"
    password = "Student123!"
    role = "student"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "$baseUrl/register" `
  -ContentType "application/json" -Body $student
```

Pero el seed es más eficiente para cargas bulk.
