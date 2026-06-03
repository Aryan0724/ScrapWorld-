import { CollectionRepository } from '@/repositories/CollectionRepository';
import { ActivityRepository } from '@/repositories/ActivityRepository';
import { gmapsQueue } from '@/queues/gmaps.queue';
import { Collection } from '@prisma/client';

export class CollectionService {
  private collectionRepo = new CollectionRepository();
  private activityRepo = new ActivityRepository();

  /**
   * Register a new collection search query, add it to the background queue, and log activity.
   */
  async startSearch(
    keyword: string,
    location: string,
    targetCount: number = 100,
    keywords: string[] = [],
    locations: string[] = []
  ): Promise<Collection> {
    const kws = keywords.length > 0 ? keywords : [keyword];
    const locs = locations.length > 0 ? locations : [location];

    const collection = await this.collectionRepo.create({
      keyword,
      location,
      radius: null,
      platform: 'GOOGLE_MAPS',
      status: 'PENDING',
      targetCount,
      keywords: kws,
      locations: locs,
      stats: {
        byKeyword: kws.reduce((acc, kw) => ({ ...acc, [kw]: 0 }), {}),
        byLocation: locs.reduce((acc, l) => ({ ...acc, [l]: 0 }), {}),
      },
    });

    // Log user search activity
    await this.activityRepo.log('SEARCH_CREATED', null, {
      collectionId: collection.id,
      keyword,
      location,
      targetCount,
      keywords: kws,
      locations: locs,
    });

    // Add task to BullMQ for asynchronous execution
    await gmapsQueue.add('scrape-maps', {
      collectionId: collection.id,
    });

    return collection;
  }

  /**
   * Retrieve collection details and raw execution payloads.
   */
  async getCollectionStatus(collectionId: string) {
    return this.collectionRepo.findById(collectionId);
  }

  /**
   * Retrieve a list of recent collections.
   */
  async getRecentCollections(limit = 10): Promise<Collection[]> {
    return this.collectionRepo.list(limit);
  }
}
