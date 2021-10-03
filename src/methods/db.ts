import { Buffer } from 'buffer';

import { UserAuth as PersonAuth, PrivateKey } from '@textile/hub';
import { Database, JSONSchema, ThreadID } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';
import { Instance } from '@textile/threaddb/dist/cjs/local/document';
import { difference, isEqual } from 'lodash';

import { collectionConfig, INote, noteKey, personKey } from '../collections';
import { CoreCollections, EduVault } from '../index';
import { WsMessageData } from '../types';

export interface StartLocalDBOptions {
  version?: number;
  onStart?: () => any;
  onReady?: (db: Database) => any;
}
/**
 * "Registered" or "official" collections are to be submitted through github pull request and will be in the collections folder
 * but these won't be the most current unles sdk version is up to date. later consider adding an api call to get the latest ones
 // TODO: call the api to get the most recent unregistered 
 */
const getCollections = (): CollectionConfig[] => {
  // const collectionsFromApi = [];
  const officialCollections = collectionConfig;
  return [
    ...officialCollections,
    // ...collectionsFromApi
  ];
};

interface DBOptions {
  name: string;
  collections: CollectionConfig[];
  eduvault: EduVault;
}
export class EduvaultDB extends Database {
  constructor({ name, collections, eduvault }: DBOptions) {
    super(name, ...collections);
    this.push = push(eduvault);
    this.sync = sync(eduvault);
  }

  push: (collectionNames: string[]) => Promise<
    | {
        error: unknown;
      }
    | undefined
  >;
  sync: (collectionNames: string[]) => Promise<
    | {
        result: Instances<any>;
        error?: undefined;
      }
    | {
        error: unknown;
        result?: undefined;
      }
  >;
  setCoreCollections = (payload: typeof this.coreCollections) =>
    (this.coreCollections = payload);
  coreCollections: CoreCollections = {
    Note: undefined,
  };
}

export const startLocalDB =
  (eduvault: EduVault) =>
  async ({ version = 1, onStart, onReady }: StartLocalDBOptions) => {
    try {
      if (onStart) onStart();
      const db = await new EduvaultDB({
        name: 'eduvault',
        collections: [...getCollections()],
        eduvault,
      });
      await db.open(version);
      await db.setCoreCollections({
        Note: db.collection<INote>(noteKey),
        Person: db.collection(personKey),
      });

      // console.log('started local db', { db });
      // const count = await db.collection('deck')?.count({});
      // console.log('count', { count });
      await eduvault.setDb(db);
      if (onReady) onReady(db);
      return { db };
    } catch (error) {
      return { error };
    }
  };

export interface StartRemoteDBOptions {
  threadID: ThreadID;
  jwt: string;
  privateKey: PrivateKey;
  onStart?: () => any;
  onReady?: (db: Database) => any;
}

export const startRemoteDB =
  (eduvault: EduVault) =>
  async ({
    threadID,
    jwt,
    privateKey,
    onStart,
    onReady,
  }: StartRemoteDBOptions) => {
    try {
      if (onStart) onStart();
      const db = eduvault.db;
      if (!db) throw 'no db found';
      // console.log({ db, threadID, privateKey });
      const getUserAuth = eduvault.loginWithChallenge(jwt, privateKey);
      const userAuth = await getUserAuth();
      // console.log({ userAuth });

      /** can test against client */
      // const client = await Client.withUserAuth(getUserAuth);
      // const threads = await client.listThreads();
      // console.log({ client, threads });
      // const dbs = await client.listDBs();
      // console.log({ dbs });
      const remote = await db.remote.setUserAuth(userAuth);
      // Grab the token, save it, or just use it
      const token = await remote.authorize(privateKey);
      // save the token encrypted with jwt locally. on refresh, get token with cookie.

      try {
        remote.id = threadID.toString();
        // const DBInfo = await remote.info();
        // console.log({ DBInfo });
      } catch (error) {
        try {
          // console.log({ DBInfoError: error });

          await remote.initialize(threadID);
        } catch (error) {
          remote.id = threadID.toString();
          console.log({ initializeError: error });
        }
      }
      // try {
      //   const DBInfo = await remote.info();
      //   console.log({ DBInfo });
      // } catch (error) {
      //   console.log({ DBInfoError: error });
      // }

      // console.log({ remote, token });
      remote.config.metadata?.set('x-textile-thread-name', db.dexie.name);
      remote.config.metadata?.set('x-textile-thread', db.id || '');
      if (onReady) onReady(db);
      return { db, remote, token };
    } catch (error) {
      console.log({ error });
      return { error };
    }
  };

type Instances<T> = (T & {
  _id: string;
} & Instance)[];

const setSnapshot = <T>(
  collectionName: string,
  instances: Instances<T>,
  type: 'local' | 'remote'
) => {
  const instanceDocuments = instances?.map((instance) => {
    return instance.toJSON();
  });
  const snapshot = JSON.stringify(instanceDocuments);
  // TODO: store more than one snapshot
  localStorage.setItem(type + 'Snapshot_' + collectionName, snapshot);
};

export const getSnapshot = (
  collectionName: string,
  type: 'local' | 'remote'
) => {
  const snapshotString = localStorage.getItem(
    type + 'Snapshot_' + collectionName
  );
  if (!snapshotString) return null;
  const snapshot = JSON.parse(snapshotString);
  return snapshot as JSONSchema[];
};

export const getPushBacklog = () => {
  const backlog = localStorage.getItem('pushBacklog');
  if (!backlog) return null;
  return JSON.parse(backlog) as string[];
};

export const addToPushBacklog = (collectionName: string) => {
  try {
    let backlog: string[];
    const backlogString = localStorage.getItem('pushBacklog');
    if (!backlogString) backlog = [];
    else backlog = JSON.parse(backlogString);
    backlog.push(collectionName);
    return { backlog };
  } catch (error) {
    return { error };
  }
};

export const push =
  (eduvault: EduVault) => async (collectionNames: string[]) => {
    try {
      const remote = eduvault.db?.remote;
      if (!remote) throw 'no remote found';

      eduvault.isSyncing = true;
      console.log('starting push');
      const collectionsToPush = [...collectionNames];
      const previousBacklog = getPushBacklog();

      if (previousBacklog) {
        previousBacklog.forEach((backlog) => {
          if (!collectionsToPush.includes(backlog))
            collectionsToPush.push(backlog);
        });
      }
      const online = await eduvault.api.ping();

      const result: { success: string[]; backlog: string[] } = {
        success: [],
        backlog: [],
      };
      collectionsToPush.forEach(async (collectionName) => {
        try {
          if (!online) {
            const { backlog, error } = addToPushBacklog(collectionName);
            console.log({ backlog, error });
            if (error || !backlog) throw error;
            return (result.backlog = backlog);
          }
          await remote.push(collectionName);
          return result.success.push(collectionName);
        } catch (error) {
          return { error };
        }
      });

      eduvault.isSyncing = false;
      return;
    } catch (error) {
      eduvault.isSyncing = false;
      return { error };
    }
  };

export const sync =
  (eduvault: EduVault) =>
  /**
   * Pulls a collection from the remote and applies local changes on top of it. Also creates a snapshot of each the local and remote state before sync stored in localStorage in case the user wants to roll back changes after the sync
   */
  async (collectionNames: string[]) => {
    console.log('starting debounced sync');
    try {
      const remote = eduvault.db?.remote;
      if (!remote) throw 'no remote found';
      const online = await eduvault.api.ping();
      if (!online) throw 'must be online to sync';

      const result: Instances<any> = [];
      collectionNames.forEach(async (collectionName) => {
        eduvault.isSyncing = true;
        const localInstances = await eduvault?.db
          ?.collection(collectionName)
          ?.find()
          .sortBy('_id');

        if (localInstances)
          setSnapshot(collectionName, localInstances, 'local');

        await remote.createStash();
        await remote.pull(collectionName);
        const remoteInstances = await eduvault?.db
          ?.collection(collectionName)
          ?.find()
          .sortBy('_id');

        if (remoteInstances)
          setSnapshot(collectionName, remoteInstances, 'remote');

        const areEqual = isEqual(localInstances, remoteInstances);
        console.log({ localInstances, remoteInstances, areEqual });

        // for debugging
        if (!areEqual && localInstances && remoteInstances) {
          const remoteDiffs = difference(remoteInstances, localInstances);
          const localDiffs = difference(localInstances, remoteInstances);
          console.log({ remoteDiffs, localDiffs });
        }

        await remote.applyStash(collectionName);

        // for debugging
        const afterApplyStash = await eduvault?.db
          ?.collection(collectionName)
          ?.find()
          .sortBy('_id');
        console.log({ afterApplyStash });
        if (afterApplyStash) result.push(afterApplyStash);

        if (!areEqual) await remote.push(collectionName);
        eduvault.isSyncing = false;
      });
      return { result };
    } catch (error) {
      eduvault.isSyncing = false;
      return { error };
    }
  };

export const loginWithChallenge =
  (eduvault: EduVault) =>
  (jwt: string, privateKey: PrivateKey): (() => Promise<PersonAuth>) => {
    // we pass identity into the function returning function to make it
    // available later in the callback
    const makeSendMessage = (ws: WebSocket) => (message: WsMessageData) =>
      ws.send(JSON.stringify(message));

    return () => {
      return new Promise((resolve, reject) => {
        /** Initialize our ws connection */
        // console.log('jwt', jwt);
        // console.log('ws starting');

        const ws = new WebSocket(eduvault.URL_WS_API);
        const sendMessage = makeSendMessage(ws);
        /** Wait for our ws to open successfully */
        ws.onopen = async () => {
          try {
            // console.log('ws open');
            if (!jwt || jwt === '') throw { error: 'no jwt' };
            if (!privateKey) throw { error: 'no privateKey' };

            sendMessage({
              type: 'token-request',
              jwt: jwt,
              pubKey: privateKey.public.toString(),
            });

            ws.onmessage = async (msg) => {
              const data = JSON.parse(msg.data) as WsMessageData;
              // console.log(
              // '=================wss message===================',
              // data
              // );

              switch (data.type) {
                case 'error': {
                  console.log('wss error', data);
                  reject(data.error);
                  break;
                }
                /** The server issued a new challenge */
                case 'challenge-request': {
                  /** Convert the challenge json to a Buffer */
                  const buf = Buffer.from(data.challenge);
                  /** Person our identity to sign the challenge */
                  const signed = await privateKey.sign(buf);
                  /** Send the signed challenge back to the server */
                  sendMessage({
                    type: 'challenge-response',
                    jwt: jwt,
                    signature: Buffer.from(signed).toJSON() as any,
                  });
                  break;
                }
                /** New token generated */
                case 'token-response': {
                  if (data.personAuth) resolve(data.personAuth);
                  break;
                }
              }
            };
          } catch (error) {
            console.log('wss error');
            reject(error);
          }
        };
      });
    };
  };
