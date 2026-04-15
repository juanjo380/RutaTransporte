import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const SALT_ROUNDS = 10;

const users = [
  {
    nombre: "Juan Pérez",
    email: "juan.perez@univ.edu",
    password: "Student123!",
    rol: "ESTUDIANTE",
  },
  {
    nombre: "Carlos Rodríguez",
    email: "carlos.driver@univ.edu",
    password: "Driver123!",
    rol: "CONDUCTOR",
  },
  {
    nombre: "María González",
    email: "maria.driver@univ.edu",
    password: "Driver123!",
    rol: "CONDUCTOR",
  },
  {
    nombre: "Admin Sistema",
    email: "admin@rutauniv.com",
    password: "Admin123!",
    rol: "ADMIN",
  },
];

async function main() {
  console.log("🌱 Iniciando seeding de usuarios...\n");

  for (const user of users) {
    try {
      const existingUser = await prisma.usuario.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        console.log(`⏭️  Usuario ${user.email} ya existe, omitiendo...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

      const created = await prisma.usuario.create({
        data: {
          nombre: user.nombre,
          email: user.email,
          password: hashedPassword,
          rol: user.rol,
        },
      });

      console.log(`✅ Usuario creado: ${created.email} (${user.rol})`);
    } catch (error) {
      console.error(`❌ Error al crear ${user.email}:`, error.message);
    }
  }

  console.log("\n✨ Seeding completado");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("💥 Error fatal:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
