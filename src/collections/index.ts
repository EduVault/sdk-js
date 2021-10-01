import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';

import deckConfig from './deck';
import personConfig from './person';
export const collectionConfig: CollectionConfig[] = [
  ...deckConfig,
  ...personConfig,
];
