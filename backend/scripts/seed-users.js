import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const SALT_ROUNDS = 10;
const VALID_MODES = new Set(["create", "upsert", "sync"]);

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

function getSeedMode() {
  const argMode = process.argv
    .find((arg) => arg.startsWith("--mode="))
    ?.split("=")[1]
    ?.toLowerCase();

  const envMode = process.env.SEED_MODE?.toLowerCase();
  const mode = argMode || envMode || "upsert";

  if (!VALID_MODES.has(mode)) {
    throw new Error(
      `Modo de seed invalido: ${mode}. Usa create, upsert o sync.`
    );
  }

  return mode;
}

async function main() {
  const mode = getSeedMode();
  const seedEmails = users.map((user) => user.email.toLowerCase());

  console.log(`🌱 Iniciando seeding de usuarios (modo: ${mode})...\n`);

  for (const user of users) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

      if (mode === "create") {
        const existingUser = await prisma.usuario.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          console.log(`⏭️  Usuario ${user.email} ya existe, omitiendo...`);
          continue;
        }

        const created = await prisma.usuario.create({
          data: {
            nombre: user.nombre,
            email: user.email,
            password: hashedPassword,
            rol: user.rol,
          },
        });

        console.log(`✅ Usuario creado: ${created.email} (${user.rol})`);
        continue;
      }

      const upserted = await prisma.usuario.upsert({
        where: { email: user.email },
        create: {
          nombre: user.nombre,
          email: user.email,
          password: hashedPassword,
          rol: user.rol,
        },
        update: {
          nombre: user.nombre,
          password: hashedPassword,
          rol: user.rol,
        },
      });

      console.log(`✅ Usuario sincronizado: ${upserted.email} (${user.rol})`);
    } catch (error) {
      console.error(`❌ Error al crear ${user.email}:`, error.message);
    }
  }

  if (mode === "sync") {
    const deleteResult = await prisma.usuario.deleteMany({
      where: {
        email: {
          notIn: seedEmails,
        },
      },
    });

    console.log(
      `🧹 Limpieza sync completada: ${deleteResult.count} usuario(s) eliminado(s) por no estar en la lista.`
    );
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
