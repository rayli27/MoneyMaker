import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

function getConnectionString() {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("Missing DATABASE_URL env var.");
  return cs;
}

const prisma =
  global.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: getConnectionString() }),
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;

