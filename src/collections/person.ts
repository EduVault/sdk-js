import { JSONSchema } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';
import { InstanceBase } from '../types';

/*
 *  This should contain all of the person's home page and cross-app preferences
 */
export type IPerson = InstanceBase<{
  username: string;
  birthDay?: number;
}>;

export type PersonCollection = Collection<IPerson>;
export const personKey = 'person';
export const personSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Person',
  properties: {
    _id: { type: 'string' },
    _mod: { type: 'string' },
    _created: { type: 'number' },
    _ttl: { type: 'number' },
    _deleted: { type: 'boolean' },

    username: { type: 'string' },
    birthDay: { type: 'number' },
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
