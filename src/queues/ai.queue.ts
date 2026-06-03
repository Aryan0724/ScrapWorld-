import { Queue } from 'bullmq';
import redisConnection from '@/lib/redis';

export const aiQueue = new Queue('ai-analysis', {
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
