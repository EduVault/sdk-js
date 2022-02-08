import { Buffer } from 'buffer';
import { UserAuth as PersonAuth, PrivateKey, Client } from '@textile/hub';
import { Context } from '@textile/context';

import { Database, JSONSchema, Remote } from '@textile/threaddb';
// import { difference, isEqual } from 'lodash';
import { DBCoreMutateRequest, DBCoreMutateResponse } from 'dexie';
import {
  collectionConfig,
  INote,
  IPerson,
  noteKey,
  personKey,
} from '../collections';
import { CoreCollections, EduVault } from '../index';
import { Instances, WsMessageData } from '../types';
import {
  CollectionConfig,
  DBOptions,
  EduVaultPush,
  EduVaultSync,
  StartLocalDBOptions,
  StartRemoteDBOptions,
} from '../types/db';

const textileTokenStorageName = 'eduvault-textile-remote-token';
const remoteConfigStorageName = 'eduvault-textile-remote-config';
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
    if (isSyncing !== this.isSyncing) {
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

  registerLocalListener = (
    onChange: DexieMutationEvent,
    collections?: string[],
    actionTypes?: string[]
  ) =>
    setUpLocalListener(
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

export type DexieMutationEvent = (
  req: DBCoreMutateRequest,
  res: DBCoreMutateResponse,
  tableName?: string
) => any;

export const setUpLocalListener = (
  db: EduvaultDB,
  onChange: DexieMutationEvent,
  tables: string[] = []
) => {
  return db.dexie.use({
    stack: 'dbcore',
    name: 'EduVault-Listener',
    create(downlevelDatabase) {
      return {
        ...downlevelDatabase,
        table(tableName) {
          const downlevelTable = downlevelDatabase.table(tableName);
          return {
            ...downlevelTable,
            mutate: (req) => {
              return downlevelTable.mutate(req).then((res) => {
                if (tables.length === 0) onChange(req, res, tableName);
                else if (tables.includes(tableName))
                  onChange(req, res, tableName);
                return res;
              });
            },
          };
        },
      };
    },
  });
};
export const startLocalDB =
  (eduvault: EduVault) =>
  async ({ version = 1, onStart, onReady, name }: StartLocalDBOptions) => {
    try {
      if (eduvault.log) console.log('starting local db', { version });
      if (onStart) onStart();
      const db = await new EduvaultDB({
        name,
        collections: [...getCollections()],
        eduvault,
      });
      db.open(version);

      await db.setCoreCollections({
        Note: db.collection<INote>(noteKey),
        Person: db.collection<IPerson>(personKey),
      });

      // console.log('started local db', { db });
      // const count = await db.collection('deck')?.count({});
      // console.log('count', { count });

      await eduvault.setDb(db);
      if (onReady) onReady(db);
      if (eduvault.log) console.log('started local db', { db });
      return { db };
    } catch (error) {
      return { error };
    }
  };

export const startClientDB =
  (eduvault: EduVault) =>
  async ({ getUserAuth }: { getUserAuth: () => Promise<PersonAuth> }) => {
    const oldToken = localStorage.getItem(textileTokenStorageName);
    let client: Client;

    const testAndSetClient = async () => {
      if (!eduvault.db) throw 'no db';
      const threads = await client.listThreads();
      if (threads.length > 0) {
        eduvault.db.client = client;
        return client;
      } else throw 'no threads';
    };

    if (oldToken) {
      try {
        const ctx = new Context().withToken(oldToken);
        client = new Client(ctx);
        return await testAndSetClient();
      } catch (error) {
        client = await Client.withUserAuth(getUserAuth);
        return await testAndSetClient();
      }
    } else {
      client = await Client.withUserAuth(getUserAuth);
      return await testAndSetClient();
    }
  };

/** returns true if valid config */
const checkConfig = async (
  remote: Remote
): Promise<false | Remote['config']> => {
  const checkIfSignedInLastWeek = (lastSigned: string[]) => {
    if (lastSigned && lastSigned.length > 0) {
      const aWeekAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
      const lastSignedDate = new Date(lastSigned[0]);
      if (lastSignedDate < aWeekAgo) return false;

      return true;
    }
    return false;
  };
  const config = remote.config;

  const localConfig = JSON.parse(
    localStorage.getItem(remoteConfigStorageName) ?? '"{}"'
  );

  // if the passed config is valid (has metadata and signature is not expired) return it.
  const lastSigned = config.metadata?.get('x-textile-api-sig-msg');
  if (lastSigned)
    if (checkIfSignedInLastWeek(lastSigned)) {
      // console.log('config is valid');
      return config;
    }
  // console.log('config is expired');

  // otherwise inspect the saved config and return it if it is valid
  if (localConfig && localConfig.metadata) {
    const localConfigKeys = Object.keys(localConfig.metadata.headersMap);
    if (localConfigKeys.length === 0) return false;
    const lastSigned = localConfig.metadata.headersMap['x-textile-api-sig-msg'];
    if (checkIfSignedInLastWeek(lastSigned)) {
      // console.log('localConfig is valid');
      localConfigKeys.forEach((key) =>
        config.metadata?.set(key, localConfig.metadata.headersMap[key])
      );

      return config;
    }
    // console.log('localConfig is expired');
  }

  return false;
};

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

      let token = '';
      const getUserAuth = eduvault.loginWithChallenge(jwt, privateKey);

      const authenticate = async () => {
        const userAuth = await getUserAuth();
        await db.remote.setUserAuth(userAuth);
        localStorage.setItem(
          remoteConfigStorageName,
          JSON.stringify(db.remote.config)
        );
        token = await db.remote.authorize(privateKey);
        localStorage.setItem(textileTokenStorageName, token);
        return token;
      };

      const tryConnection = async (remote: Remote) => {
        try {
          const DBInfo = await remote.info();
          return DBInfo.key;
        } catch (error) {
          try {
            console.log('get dbinfo error', { error });
            const initialized = await remote.initialize(threadID.toString());
            return initialized;
          } catch (error) {
            console.log('initializeError', { error });
          }
        }
        return false;
      };
      db.remote.id = threadID.toString();
      const validConfig = await checkConfig(db.remote);

      if (validConfig) {
        db.remote.config = validConfig;
        const res = await tryConnection(db.remote);
        if (res) {
          if (onReady) onReady(db);
          return { db, remote: db.remote, token, getUserAuth };
        }
      }
      await authenticate();

      const res = await tryConnection(db.remote);
      if (res) {
        if (onReady) onReady(db);
        return { db, remote: db.remote, token, getUserAuth };
      } else throw 'error connecting to remote db';
    } catch (error) {
      console.log({ error });
      return { error };
    }
  };

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
    if (!backlog.includes(collectionName)) backlog.push(collectionName);
    return { backlog };
  } catch (error) {
    return { error };
  }
};

export const push =
  (eduvault: EduVault) => async (collectionNames: string[]) => {
    try {
      const db = eduvault.db;
      if (!db) throw 'no db found';
      const remote = db?.remote;
      if (!remote) throw 'no remote found';

      if (eduvault.log) console.log('starting push');
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
          const { backlog } = addToPushBacklog(collectionName);
          if (backlog) result.backlog = backlog;
          return { error };
        }
      });
      return result;
    } catch (error) {
      return { error };
    }
  };

export const sync = (eduvault: EduVault) => {
  const sync = async (collectionNames: string[]) => {
    if (eduvault.log) console.log('starting sync ', collectionNames);
    try {
      const db = eduvault.db;
      if (!db) throw 'no db found';
      const remote = eduvault.db?.remote;
      if (!remote) throw 'no remote found';
      const online = await eduvault.api.ping();
      if (!online) throw 'must be online to sync';
      db.setIsSyncing(true);
      const syncCollection = async (collectionName: string) => {
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

        // TODO: re-institute this
        // const areEqual = isEqual(localInstances, remoteInstances);

        // for debugging
        // if (!areEqual && localInstances && remoteInstances) {
        //   const remoteDiffs = difference(remoteInstances, localInstances);
        //   const localDiffs = difference(localInstances, remoteInstances);
        //   console.log({ remoteDiffs, localDiffs });
        // }

        await remote.applyStash(collectionName);

        // // for debugging
        // const afterApplyStash = await eduvault?.db
        //   ?.collection(collectionName)
        //   ?.find()
        //   .sortBy('_id');
        // console.log({ afterApplyStash });
        // if (afterApplyStash) return result.push(afterApplyStash);

        // if (!areEqual)
        db.setIsSyncing(false);
        return collectionName;
      };

      const result = await Promise.all(collectionNames.map(syncCollection));
      return { result };
    } catch (error) {
      if (eduvault?.db) eduvault.db.setIsSyncing(false);
      return { error };
    } finally {
      if (eduvault?.db) eduvault.db.setIsSyncing(false);
    }
  };
  return sync;
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
