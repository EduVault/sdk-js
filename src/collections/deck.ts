import { JSONSchema } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';

export const cardSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Card',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    frontText: { type: 'string' },
    backText: { type: 'string' },
    updatedAt: { type: 'integer' },
  },
};
export const deckSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Deck',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    title: { type: 'string' },
    updatedAt: { type: 'integer' },
    cards: {
      type: 'array',
      items: cardSchema,
    },
  },
};
const deckSchemaConfig: CollectionConfig[] = [
  {
    name: 'deck',
    schema: deckSchema,
  },
];

export default deckSchemaConfig;
