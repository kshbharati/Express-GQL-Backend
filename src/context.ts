import { PrismaClient } from "@prisma/client";
import Redis from 'ioredis'

export const prismaContext = new PrismaClient();


export const redisContext = new Redis({
        port:6379,
        host: '127.0.0.1',
        username: 'default',
        password: process.env.REDIS_PASSWORD,
        db:0
    });

export interface AppContext {
    prisma: PrismaClient;
    redis: Redis
    token?: string;
}
