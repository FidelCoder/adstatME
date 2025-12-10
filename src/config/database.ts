import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Prisma Client singleton
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Log database queries in development
prisma.$on('warn', (e) => {
  logger.warn({ prisma: e }, 'Prisma warning');
});

prisma.$on('error', (e) => {
  logger.error({ prisma: e }, 'Prisma error');
});

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default prisma;


