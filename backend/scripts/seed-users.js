import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/prisma.js";

const SALT_ROUNDS = 10;
const VALID_MODES = new Set(["create", "upsert", "sync"]);
const DEFAULT_SEED_FILE = "scripts/seed-users.public.json";

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

function getSeedFilePath() {
  const argFile = process.argv
    .find((arg) => arg.startsWith("--file="))
    ?.slice("--file=".length)
    ?.trim();

  const envFile = process.env.SEED_USERS_FILE?.trim();
  const selected = argFile || envFile || DEFAULT_SEED_FILE;

  if (path.isAbsolute(selected)) {
    return selected;
  }

  return path.resolve(process.cwd(), selected);
}

async function loadSeedUsers(seedFilePath) {
  const raw = await fs.readFile(seedFilePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("El archivo de seed debe contener un arreglo JSON de usuarios.");
  }

  for (const [index, user] of parsed.entries()) {
    const hasRequiredFields =
      typeof user?.nombre === "string" &&
      typeof user?.email === "string" &&
      typeof user?.password === "string" &&
      typeof user?.rol === "string";

    if (!hasRequiredFields) {
      throw new Error(
        `Usuario invalido en indice ${index}. Campos requeridos: nombre, email, password, rol.`
      );
    }
  }

  return parsed;
}

async function main() {
  const mode = getSeedMode();
  const seedFilePath = getSeedFilePath();
  const users = await loadSeedUsers(seedFilePath);

  if (users.length === 0) {
    throw new Error("El archivo de seed no contiene usuarios.");
  }

  const seedEmails = users.map((user) => user.email.toLowerCase());

  console.log(`🌱 Iniciando seeding de usuarios (modo: ${mode})...`);
  console.log(`📄 Archivo de seed: ${seedFilePath}\n`);

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
