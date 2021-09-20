import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';
import { JSONSchema } from '@textile/threaddb';

export const dummyPersonSchema: JSONSchema = {
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

export const dummyPersonSchema2: JSONSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  title: 'Person2',
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
export const dummyCollections: CollectionConfig[] = [
  {
    name: 'Person',
    schema: dummyPersonSchema,
  },
  {
    name: 'Person2',
    schema: dummyPersonSchema2,
  },
];

export const dummyCollection: CollectionConfig = {
  name: 'Person',
  schema: dummyPersonSchema,
};

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
export const deckSchemaConfig: CollectionConfig = {
  name: 'deck',
  schema: deckSchema,
};
