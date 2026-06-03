import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisConnectionSingleton = () => {
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });
};

declare const globalThis: {
  redisGlobal: ReturnType<typeof redisConnectionSingleton> | undefined;
} & typeof global;

const redisConnection = globalThis.redisGlobal ?? redisConnectionSingleton();

export default redisConnection;

if (process.env.NODE_ENV !== 'production') {
  globalThis.redisGlobal = redisConnection;
}
