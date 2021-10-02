import { Buffer } from 'buffer';

import { UserAuth as PersonAuth, PrivateKey } from '@textile/hub';
import { Collection, Database, ThreadID } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';
import { isEqual, difference } from 'lodash';

import { EduVault } from '../index';
import { WsMessageData } from '../types';
import { collectionConfig } from '../collections';

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

export const startLocalDB =
  (eduvault: EduVault) =>
  async ({ version = 1, onStart, onReady }: StartLocalDBOptions) => {
    try {
      if (onStart) onStart();
      const db = await new Database('eduvault', ...getCollections());
      await db.open(version);
      // console.log('started local db', { db });
      // const count = await db.collection('deck')?.count({});
      // console.log('count', { count });
      eduvault.db = db;
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

export const sync = (eduvault: EduVault) => {
  return async <T>(collectionName: Collection['name'], debounceTime = 500) => {
    console.log('starting sync', {
      syncSave: collectionName,
      remote: !!eduvault.db?.remote,
      debounceTime,
    });
    eduvault.syncChanges<T>(collectionName);

    // redo offline support stuff,  backlog later

    // if (!!eduvault.db?.remote && (await eduvault.online())) {
    //   const syncToRemote = async () => {
    //     console.log('saving changes remotely');
    //     const changes = await eduvault.syncChanges<T>(collectionName);
    //     console.log({ changes });
    //     if ('error' in changes) return changes;
    //     else {
    //       eduvault.backlog = undefined;
    //       return changes;
    //     }
    //   };
    //   const debouncedSync = debounce(syncToRemote, debounceTime);
    //   return debouncedSync();
    // } else {
    //   console.log('adding to backlog');
    //   eduvault.backlog = collectionName;
    //   eduvault.checkConnectivityClearBacklog();
    //   return { error: 'offline' };
    // }
  };
};

export const syncChanges = (eduvault: EduVault) => {
  return async <T>(collectionName: string) => {
    console.log('starting debounced sync');
    try {
      const remote = eduvault.db?.remote;
      if (!remote) throw 'no remote found';
      const localInstances = await eduvault?.db
        ?.collection<T>(collectionName)
        ?.find()
        .sortBy('_id');
      eduvault.isSyncing = true;
      await remote.createStash();
      await remote.pull(collectionName);
      const remoteInstances = await eduvault?.db
        ?.collection<T>(collectionName)
        ?.find()
        .sortBy('_id');
      const areEqual = isEqual(localInstances, remoteInstances);
      console.log({ localInstances, remoteInstances, areEqual });
      if (!areEqual && !!localInstances && !!remoteInstances) {
        const remoteDiffs = difference(remoteInstances, localInstances);
        const localDiffs = difference(localInstances, remoteInstances);
        console.log({ remoteDiffs, localDiffs });
      }
      await remote.applyStash(collectionName);
      const afterApplyStash = await eduvault?.db
        ?.collection<T>(collectionName)
        ?.find()
        .sortBy('_id');
      console.log({ afterApplyStash });
      if (!areEqual) await remote.push(collectionName);
      return { remoteInstances };
    } catch (error) {
      return { error };
    }
  };
};

const makeSendMessage = (ws: WebSocket) => (message: WsMessageData) =>
  ws.send(JSON.stringify(message));

export const loginWithChallenge =
  (eduvault: EduVault) =>
  (jwt: string, privateKey: PrivateKey): (() => Promise<PersonAuth>) => {
    // we pass identity into the function returning function to make it
    // available later in the callback
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
