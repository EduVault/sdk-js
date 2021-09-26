import { Buffer } from 'buffer';

import { UserAuth as PersonAuth, PrivateKey } from '@textile/hub';
import { Collection, Database, ThreadID } from '@textile/threaddb';
import { CollectionConfig } from '@textile/threaddb/dist/cjs/local/collection';
import { isEqual, difference } from 'lodash';

import { EduVault } from '../index';

export interface StartLocalDBOptions {
  collectionConfig: CollectionConfig;
  version?: number;
  onStart?: () => any;
  onReady?: (db: Database) => any;
}

export const startLocalDB = async ({
  collectionConfig,
  version = 1,
  onStart,
  onReady,
}: StartLocalDBOptions) => {
  try {
    if (onStart) onStart();
    const db = await new Database('eduvault', collectionConfig);
    await db.open(version);
    console.log('started local db', { db });
    // const count = await db.collection('deck')?.count({});
    // console.log('count', { count });

    if (onReady) onReady(db);
    return db;
  } catch (error) {
    return { error };
  }
};

export interface StartRemoteDBOptions {
  db: Database;
  threadID: ThreadID;
  jwt: string;
  privateKey: PrivateKey;
  onStart?: () => any;
  onReady?: (db: Database) => any;
}

export const startRemoteDB =
  (eduvault: EduVault) =>
  async ({
    db,
    threadID,
    jwt,
    privateKey,
    onStart,
    onReady,
  }: StartRemoteDBOptions) => {
    try {
      if (onStart) onStart();
      console.log({ db, threadID, privateKey });
      const getUserAuth = eduvault.loginWithChallenge(jwt, privateKey);
      const userAuth = await getUserAuth();
      // console.log({ userAuth });

      /** this is only getting a one-time auth.... */
      // console.log({ getUserAuth });
      /** can test against client */
      // const client = await Client.withUserAuth(getUserAuth);
      // const threads = await client.listThreads();
      // console.log({ client, threads });
      // const dbs = await client.listDBs();
      // console.log({ dbs });
      const remote = await db.remote.setUserAuth(userAuth);
      console.log({ remote });
      // Grab the token, save it, or just use it
      const token = await remote.authorize(privateKey);
      console.log({ token });
      // save the token encrypted with jwt locally. on refresh, get token with cookie.

      try {
        remote.id = threadID.toString();
        const DBInfo = await remote.info();
        console.log({ DBInfo });
      } catch (error) {
        try {
          console.log({ DBInfoError: error });

          await remote.initialize(threadID);
        } catch (error) {
          remote.id = threadID.toString();
          console.log({ initializeError: error });
        }
      }
      try {
        const DBInfo = await remote.info();
        console.log({ DBInfo });
      } catch (error) {
        console.log({ DBInfoError: error });
      }

      console.log({ remote, token });
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

export const loginWithChallenge =
  (eduvault: EduVault) =>
  (jwt: string, privateKey: PrivateKey): (() => Promise<PersonAuth>) => {
    // we pass identity into the function returning function to make it
    // available later in the callback
    return () => {
      return new Promise((resolve, reject) => {
        /** Initialize our websocket connection */
        // console.log('jwt', jwt);
        console.log('socket starting');

        const socket = new WebSocket(eduvault.URL_API);
        /** Wait for our socket to open successfully */
        socket.onopen = async () => {
          console.log('socket open');
          if (!jwt || jwt === '') throw { error: 'no jwt' };
          if (!privateKey) throw { error: 'no privateKey' };
          socket.send(
            JSON.stringify({
              type: 'token-request',
              jwt: jwt,
              pubKey: privateKey.public.toString(),
            })
          );

          socket.onmessage = async (msg) => {
            const data = JSON.parse(msg.data);
            console.log(
              '=================wss message===================',
              data
            );

            switch (data.type) {
              case 'error': {
                console.log('wss error', data);
                reject(data.value);
                break;
              }
              /** The server issued a new challenge */
              case 'challenge-request': {
                /** Convert the challenge json to a Buffer */
                const buf = Buffer.from(data.value);
                /** Person our identity to sign the challenge */
                const signed = await privateKey.sign(buf);
                /** Send the signed challenge back to the server */
                socket.send(
                  JSON.stringify({
                    type: 'challenge-response',
                    jwt: jwt,
                    signature: Buffer.from(signed).toJSON(),
                  })
                );
                break;
              }
              /** New token generated */
              case 'token-response': {
                resolve(data.value);
                break;
              }
            }
          };
        };
      });
    };
  };

export const startRemoteWrapped = (eduvault: EduVault) => {
  return async (options: StartRemoteDBOptions) => {
    const remoteStart = await eduvault.startRemoteRaw(options);
    if ('error' in remoteStart) return { error: remoteStart.error };
    else {
      eduvault.remoteToken = remoteStart.token;
      eduvault.db = remoteStart.db;
      return eduvault.db;
    }
  };
};
export const startLocalWrapped = (eduvault: EduVault) => {
  return async (options: StartLocalDBOptions) => {
    const db = await startLocalDB(options);
    if ('error' in db) return { error: db.error };
    else {
      eduvault.db = db;
      return db;
    }
  };
};
