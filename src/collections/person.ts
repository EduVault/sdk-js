import { JSONSchema } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';

/*
 *  This should contain all of the person's home page and cross-app preferences
 */
export interface IPerson {
  _id: string;
  username: string;
  birthDay: number;
}
export type PersonCollection = Collection<IPerson>;
export const personKey = 'person';
export const personSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Person',
  properties: {
    _id: {
      type: 'string',
    },
    username: {
      type: 'string',
    },
    birthDay: {
      type: 'number',
    },
  },
  required: ['_id', 'username'],
};

const collections: CollectionConfig[] = [
  {
    name: personKey,
    schema: personSchema,
  },
];

export default collections;
