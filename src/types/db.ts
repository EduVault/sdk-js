import { PrivateKey, ThreadID } from '@textile/hub';
import { Database } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';
import { Instance } from '@textile/threaddb/dist/cjs/local/document';

import EduVault, { INote, IPerson } from '../index';

export { CollectionConfig, Instance };

export type InstanceBase<T> = T & {
  _id: string;
  /**
   * Used exclusively by Dexie: Date last modified
   * number created with `new Date().getTime()`
   */
  _mod?: number;
  /**
   * Date created
   * number created with `new Date().getTime()`
   */
  _created?: number;
  /**
   * Time To Live. Will be deleted when this date is reached
   * number created with `new Date().getTime(days * 30)`
   */
  _ttl?: number;
  _deleted?: boolean;
  /**
   * Used exclusively by Eduvault: Date last modified
   * number created with `new Date().getTime()`
   */
  _updatedAt?: number;
};

export type Instances<T> = (Instance & InstanceBase<T>)[];

export interface CoreCollections {
  Note?: Collection<INote>;
  Person?: Collection<IPerson>;
}
export interface StartLocalDBOptions {
  version?: number;
  onStart?: () => any;
  onReady?: (db: Database) => any;
  name: string;
  onChange?: () => any;
}

export interface DBOptions {
  name: string;
  collections: CollectionConfig[];
  eduvault: EduVault;
}

/**
 * Pulls changes from remote, then applies changes over local, then pushes final result to remote.
 */
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

/**
 * Pushes changes to remote with a default 5 second debounce
 * If it fails it will add current collection to backlog.
 * Tries the backlog on each call.
 */
export type EduVaultPush = (collectionNames: string[]) => Promise<{
  success: string[];
  backlog: string[];
}>;

export interface StartRemoteDBOptions {
  threadID: ThreadID;
  jwt: string;
  privateKey: PrivateKey;
  onStart?: () => any;
  onReady?: (db: Database) => any;
}
