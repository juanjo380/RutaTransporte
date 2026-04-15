# Script de Seeding de Usuarios

## ¿Qué es?

Script Node.js que carga usuarios de manera manual en la BD con contraseñas **encriptadas automáticamente**.

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

## Uso

### Opción 1: Con npm (recomendado)

```bash
cd backend
npm run seed
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

## Modificar usuarios

Para añadir o cambiar usuarios, edita `scripts/seed-users.js`:

```javascript
const users = [
  {
    nombre: "Tu Nombre",
    email: "tu.email@univ.edu",
    password: "TuContraseña123!",
    rol: "ESTUDIANTE", // ESTUDIANTE, CONDUCTOR, ADMIN
  },
  // Más usuarios...
];
```

Luego corre nuevamente `npm run seed`.

## Seguridad

✅ Las contraseñas se encriptan automáticamente con bcrypt (SALT_ROUNDS=10)  
✅ No se guarda plaintext en BD  
✅ Compatible con login backend (autenticación funcional)  
✅ Idempotente: no duplica usuarios si ya existen  

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
