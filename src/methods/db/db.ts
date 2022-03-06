import { Client } from '@textile/hub';
import { Database } from '@textile/threaddb';
// import { difference, isEqual } from 'lodash';

import { collectionConfig } from '../../collections';
import { CoreCollections, EduVault } from '../../index';

import {
  CollectionConfig,
  DBOptions,
  EduVaultPush,
  EduVaultSync,
} from '../../types/db';
import { DexieMutationEvent, setUpDexieListener } from './setupDexieListener';

export const textileTokenStorageName = 'eduvault-textile-remote-token';
export const remoteConfigStorageName = 'eduvault-textile-remote-config';

/**
 * "Registered" or "official" collections are to be submitted through github pull request and will be in the collections folder
 * but these won't be the most current unless sdk version is up to date. later consider adding an api call to get the latest ones
 // TODO: call the api to get the most recent unregistered 
 */
export const getCollections = (): CollectionConfig[] => {
  // const collectionsFromApi = [];
  const officialCollections = collectionConfig;
  return [
    ...officialCollections,
    // ...collectionsFromApi
  ];
};

export class EduvaultDB extends Database {
  constructor({ name, collections, eduvault }: DBOptions) {
    super(name, ...collections);
    this.push = push(eduvault);
    this.sync = sync(eduvault);
    this.onSyncingChange = () => false;
    this.isSyncing = false;
    this.client = new Client();
  }
  client: Client;
  /**
   * Pushes changes to remote database
   */
  push: EduVaultPush;
  /**
   * Pulls a collection from the remote and applies local changes on top of it. Also creates a snapshot of each the local and remote state before sync stored in localStorage in case the user wants to roll back changes after the sync
   */
  sync: EduVaultSync;

  onSyncingChange: () => any = () => this.getIsSyncing();
  isSyncing: boolean;
  setIsSyncing = (isSyncing: boolean) => {
    if (isSyncing !== this.getIsSyncing()) {
      this.isSyncing = isSyncing;
      this.onSyncingChange();
    }
  };
  getIsSyncing = () => this.isSyncing;
  /**
   *
   * core collections are the ones that are registered in the collections folder. They will have typescript definitions and will be available to use in the sdk.
   * TODO : Developers can also add their own locally defined collections but other apps won't be able to find them as easily.
   */
  setCoreCollections = (payload: typeof this.coreCollections) =>
    (this.coreCollections = payload);
  coreCollections: CoreCollections = {
    Note: undefined,
  };

  /** Listen to changes directly from the Dexie database */
  registerDexieListener = (
    onChange: DexieMutationEvent,
    collections?: string[],
    actionTypes?: string[]
  ) =>
    setUpDexieListener(
      this,
      (req, res, tableName) => {
        if (actionTypes && actionTypes.length > 0) {
          if (actionTypes.includes(req.type)) {
            return onChange(req, res, tableName);
          }
          return null;
        }
        return onChange(req, res, tableName);
      },
      collections
    );
}

// const setSnapshot = <T>(
//   collectionName: string,
//   instances: Instances<T>,
//   type: 'local' | 'remote'
// ) => {
//   const instanceDocuments = instances?.map((instance) => {
//     return instance.toJSON();
//   });
//   const snapshot = JSON.stringify(instanceDocuments);
//   // TODO: store more than one snapshot
//   localStorage.setItem(type + 'Snapshot_' + collectionName, snapshot);
// };

// export const getSnapshot = (
//   collectionName: string,
//   type: 'local' | 'remote'
// ) => {
//   const snapshotString = localStorage.getItem(
//     type + 'Snapshot_' + collectionName
//   );
//   if (!snapshotString) return null;
//   const snapshot = JSON.parse(snapshotString);
//   return snapshot as JSONSchema[];
// };

// export const getPushBacklog = () => {
//   const backlog = localStorage.getItem('pushBacklog');
//   if (!backlog) return null;
//   return JSON.parse(backlog) as string[];
// };

// export const addToPushBacklog = (collectionName: string) => {
//   try {
//     let backlog: string[];
//     const backlogString = localStorage.getItem('pushBacklog');
//     if (!backlogString) backlog = [];
//     else backlog = JSON.parse(backlogString);
//     if (!backlog.includes(collectionName)) backlog.push(collectionName);
//     return { backlog };
//   } catch (error) {
//     return { error };
//   }
// };

export const push =
  (eduvault: EduVault) => async (collectionNames: string[]) => {
    if (!eduvault.db) throw 'no db found';
    if (!eduvault.db.remote) throw 'no remote found';
    try {
      const collectionsToPush = [...collectionNames];
      if (eduvault.log)
        console.log(
          'after debounce, time: ',
          new Date().getSeconds(),
          collectionsToPush
        );
      // const previousBacklog = getPushBacklog();

      // if (previousBacklog) {
      //   previousBacklog.forEach((backlog) => {
      //     if (!collectionsToPush.includes(backlog))
      //       collectionsToPush.push(backlog);
      //   });
      // }
      const online = await eduvault.api.ping();

      const result: { success: string[]; backlog: string[] } = {
        success: [],
        backlog: [],
      };

      const promises = collectionsToPush.map(async (collectionName) => {
        try {
          if (!eduvault.db) throw 'no db found';
          if (!eduvault.db.remote) throw 'no remote found';
          if (!online) {
            // const { backlog, error } = addToPushBacklog(collectionName);
            // console.log({ backlog, error });
            // if (error || !backlog) throw error;
            // return (result.backlog = backlog);
          }
          await eduvault.db.remote.push(collectionName);
          result.success.push(collectionName);
        } catch (error) {
          // const { backlog } = addToPushBacklog(collectionName);
          // if (backlog) result.backlog = backlog;
          console.error(error);
        }
      });
      await Promise.all(promises);
      return result;
    } catch (error) {
      console.log('push error');
      console.error(error);
      throw error;
    } finally {
      console.log('finished push');
    }
  };

export const sync = (eduvault: EduVault) => {
  const sync = async (collectionNames: string[]) => {
    if (eduvault.log) console.log('starting sync ', collectionNames);
    try {
      if (!eduvault.db) throw 'no db found';
      if (!eduvault.db.remote) throw 'no remote found';
      const online = await eduvault.api.ping();
      if (!online) throw 'must be online to sync';
      eduvault.db.setIsSyncing(true);
      const syncCollection = async (collectionName: string) => {
        if (!eduvault.db) throw 'no db found';
        if (!eduvault.db.remote) throw 'no remote found';
        // const localInstances = await eduvault?.db
        //   ?.collection(collectionName)
        //   ?.find()
        //   .sortBy('_id');
        // if (localInstances)
        //   setSnapshot(collectionName, localInstances, 'local');
        await eduvault.db.remote.createStash();
        // const remoteInfo = await eduvault.db.remote.info();
        // console.log({ remoteInfo });
        console.log('pull');
        const pulled = await eduvault.db.remote.pull(collectionName);
        console.log({ pulled });
        // const remoteInstances = await eduvault?.db
        //   ?.collection(collectionName)
        //   ?.find()
        //   .sortBy('_id');

        // if (remoteInstances)
        //   setSnapshot(collectionName, remoteInstances, 'remote');

        // TODO: re-institute this
        // const areEqual = isEqual(localInstances, remoteInstances);

        // for debugging
        // if (!areEqual && localInstances && remoteInstances) {
        //   const remoteDiffs = difference(remoteInstances, localInstances);
        //   const localDiffs = difference(localInstances, remoteInstances);
        //   console.log({ remoteDiffs, localDiffs });
        // }

        console.log('applyStash');
        await eduvault.db.remote.applyStash(collectionName);

        // // for debugging
        // const afterApplyStash = await eduvault?.db
        //   ?.collection(collectionName)
        //   ?.find()
        //   .sortBy('_id');
        // console.log({ afterApplyStash });
        // if (afterApplyStash) return result.push(afterApplyStash);

        // if (!areEqual)
        return collectionName;
      };
      const promises = collectionNames.map(syncCollection);
      const result = await Promise.all(promises);
      console.log({ result });
      eduvault.db.setIsSyncing(false);

      return { result };
    } catch (error) {
      console.log({ syncError: error });
      eduvault.db?.setIsSyncing(false);
      return { error };
    } finally {
      console.log('sync finally');
      eduvault.db?.setIsSyncing(false);
    }
  };
  return sync;
};
