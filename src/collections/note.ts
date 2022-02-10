import { JSONSchema } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';
import { InstanceBase } from '../types';

export const noteKey = 'note';

export type INote = InstanceBase<{
  text: string;
}>;

export type NoteCollection = Collection<INote>;
export const noteSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Note',
  properties: {
    _id: { type: 'string' },
    _mod: { type: 'string' },
    _created: { type: 'number' },
    _ttl: { type: 'number' },
    _deleted: { type: 'boolean' },

    text: { type: 'string' },
  },
  required: ['_id', 'text'],
};

const collections: CollectionConfig[] = [
  {
    name: noteKey,
    schema: noteSchema,
  },
];

export default collections;
