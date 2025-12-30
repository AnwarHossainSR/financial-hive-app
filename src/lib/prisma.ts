import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "@prisma/client";
import { PrismaPGlite } from "pglite-prisma-adapter";

// In Prisma 7, the connection URL is no longer passed directly in the datasource block of schema.prisma.
// For the runtime, you must pass either an 'adapter' or 'accelerateUrl' to the constructor.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize PGlite (either in-memory or persisted)
const pglite = new PGlite();
const adapter = new PrismaPGlite(pglite);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // If using Prisma Accelerate instead:
    // accelerateUrl: import.meta.env.VITE_PRISMA_ACCELERATE_URL,
  });

if (import.meta.env.MODE !== "production") globalForPrisma.prisma = prisma;
