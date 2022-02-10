import { JSONSchema } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';
import { InstanceBase } from '../types';

export type ICard = InstanceBase<{
  frontText: string;
  backText: string;
}>;
export const cardSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Card',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    _mod: { type: 'string' },
    _created: { type: 'number' },
    _ttl: { type: 'number' },
    _deleted: { type: 'boolean' },

    frontText: { type: 'string' },
    backText: { type: 'string' },
  },
};

export type IDeck = InstanceBase<{
  username: string;
  birthDay?: number;
}>;
export const deckSchema: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Deck',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    _mod: { type: 'string' },
    _created: { type: 'number' },
    _ttl: { type: 'number' },
    _deleted: { type: 'boolean' },

    title: { type: 'string' },
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
