import { JSONSchema } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';

export const noteSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'note',
  properties: {
    _id: {
      type: 'string',
    },
    text: {
      type: 'string',
    },
    createdDate: {
      type: 'string',
    },
    editedDate: { type: 'string' },
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
