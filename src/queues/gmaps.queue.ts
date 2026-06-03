import { Queue } from 'bullmq';
import redisConnection from '@/lib/redis';

export const gmapsQueue = new Queue('gmaps-scrape', {
  connection: redisConnection as any,
  skipVersionCheck: true,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
