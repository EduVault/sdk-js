import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';

import deckConfig from './deck';
import noteConfig from './note';
import personConfig from './person';

export const collectionConfig: CollectionConfig[] = [
  ...deckConfig,
  ...personConfig,
  ...noteConfig,
];
