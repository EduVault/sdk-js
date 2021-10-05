import { PrivateKey, ThreadID } from '@textile/hub';
import { Database } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';
import { Instance } from '@textile/threaddb/dist/cjs/local/document';

import EduVault, { INote, IPerson } from '..';

export { CollectionConfig, Instance };

export type Instances<T> = (T & {
  _id: string;
} & Instance)[];

export interface CoreCollections {
  Note?: Collection<INote>;
  Person?: Collection<IPerson>;
}
export interface StartLocalDBOptions {
  version?: number;
  onStart?: () => any;
  onReady?: (db: Database) => any;
}

export interface DBOptions {
  name: string;
  collections: CollectionConfig[];
  eduvault: EduVault;
}

export type EduVaultSync = (collectionNames: string[]) => Promise<
  | {
      result: string[];
      error?: undefined;
    }
  | {
      error: unknown;
      result?: undefined;
    }
>;
export type EduVaultPush = (collectionNames: string[]) => Promise<
  | {
      error: unknown;
    }
  | undefined
>;
export interface StartRemoteDBOptions {
  threadID: ThreadID;
  jwt: string;
  privateKey: PrivateKey;
  onStart?: () => any;
  onReady?: (db: Database) => any;
}
