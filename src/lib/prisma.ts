import { PrismaClient } from '@prisma/client';

let client: PrismaClient | undefined;

const prismaClientSingleton = () => {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const getPrisma = () => {
  if (process.env.NODE_ENV === 'production') {
    return prismaClientSingleton();
  } else {
    if (!global.prismaGlobal) {
      global.prismaGlobal = prismaClientSingleton();
    }
    return global.prismaGlobal;
  }
};

const handler = {
  get(target: any, prop: string) {
    const prisma = getPrisma();
    return prisma[prop as keyof PrismaClient];
  },
};

export const prisma = new Proxy({}, handler);