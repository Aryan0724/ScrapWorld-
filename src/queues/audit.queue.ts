import { Queue } from 'bullmq';
import redisConnection from '@/lib/redis';

export const auditQueue = new Queue('website-audit', {
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
