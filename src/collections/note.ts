import { JSONSchema } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';

export const noteKey = 'note';

/**
 * createdDate and updatedDate are craeated with `new Date().getTime()`
 */
export interface INote {
  _id: string;
  text: string;
  createdDate: number;
  editedDate: number;
}

export const noteSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'note',
  properties: {
    _id: { type: 'string' },
    text: { type: 'string' },
    createdDate: { type: 'number' },
    editedDate: { type: 'number' },
  },
  required: ['_id', 'text', 'createdDate', 'editedDate'],
};

const collections: CollectionConfig[] = [
  {
    name: 'note',
    schema: noteSchema,
  },
];

export default collections;
