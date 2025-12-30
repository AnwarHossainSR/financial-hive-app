import { PGlite } from "@electric-sql/pglite";
import { PrismaClient } from "@prisma/client/edge";
import { PrismaPGlite } from "pglite-prisma-adapter";

// In Prisma 7, the connection URL is no longer passed directly in the datasource block of schema.prisma.
// For the runtime, you must pass either an 'adapter' or 'accelerateUrl' to the constructor.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize PGlite with persistent storage (IndexedDB in the browser)
const pglite = new PGlite("idb://financial-hive-db");
const adapter = new PrismaPGlite(pglite);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (import.meta.env.MODE !== "production") globalForPrisma.prisma = prisma;
