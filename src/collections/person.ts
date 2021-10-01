import { JSONSchema } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';

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
  required: ['_id', 'username', 'birthDay'],
};

const collections: CollectionConfig[] = [
  {
    name: 'Person',
    schema: personSchema,
  },
];

export default collections;
