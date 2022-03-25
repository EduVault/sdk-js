import { PrivateKey, Remote } from '@textile/threaddb';

import EduVault, { StartRemoteDBOptions } from '../..';

import { remoteConfigStorageName, textileTokenStorageName } from './db';

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
  async ({ threadID, jwt, privateKey }: StartRemoteDBOptions) => {
    try {
      if (!eduvault.db) throw 'no db found'; // just to satisfy compiler. should never happen.

      const authenticate = async (jwt: string, privateKey: PrivateKey) => {
        if (!eduvault.db) throw 'no db found';

        try {
          const getUserAuth = eduvault.loginWithChallenge(jwt, privateKey);
          console.log('authenticating');
          const userAuth = await getUserAuth();
          console.log('userAuth', userAuth);
          const setUserAuth = await eduvault.db.remote.setUserAuth(userAuth);
          console.log('setUserAuth', setUserAuth);
          const token = await eduvault.db.remote.authorize(privateKey);
          console.log('authenticated, saving token', token);
          localStorage.setItem(
            remoteConfigStorageName,
            JSON.stringify(eduvault.db.remote.config)
          );
          localStorage.setItem(textileTokenStorageName, token);
          if (!token) throw 'no token';
          return true;
        } catch (e) {
          console.log(e);
          return false;
        }
      };
      const initialize = async () => {
        if (!eduvault.db) throw 'no db found';

        try {
          const initialized = await eduvault.db.remote.initialize(
            threadID.toString()
          );
          console.log('initialized', initialized);

          if (initialized !== threadID.toString())
            throw new Error('initialized wrong thread');
          return true;
        } catch (error: any) {
          // this error means that the thread is already initialized
          if (error.message.includes('E11000')) {
            console.log('thread already initialized');
            return true;
          }
          console.error(error);
          return false;
        }
      };

      const tryConnection = async () => {
        if (!eduvault.db) throw 'no db found';

        const initialized = await initialize();
        if (!initialized) throw 'not initialized';

        const attempt = async () => {
          if (!eduvault.db) throw 'no db found';

          const info = await eduvault.db.remote.info();
          // is this really a good test if connection is authenticated? try calling this before auth and see if it fails.
          if (!info) throw 'db info not found';
          console.log({ info });
          // const collections: string[] = [];
          // eduvault.db
          //   .collections()
          //   .forEach((value, key) => collections.push(key));
          // console.log({ collections });
          // const notes = await eduvault.db.remote.pull(collections[0]);
          // stalls out here
          // const notes = await eduvault.db.remote.pull(noteKey);
          // console.log({ notes });
          // if (notes) return true;

          if (info.key) return true;
          else throw 'core collections not found';
        };

        try {
          return await attempt();
        } catch (error: any) {
          if (error.message.includes('Unpushed local changes')) {
            console.log('unpushed local changes');
            const collections: string[] = [];
            eduvault.db
              .collections()
              .forEach((value, key) => collections.push(key));
            console.log({ collections });
            await eduvault.db.remote.push(...collections);
            return true;
          }
          console.log('tryConnection attempt error:', error);
          if (error.message.includes('Auth expired')) {
            const authenticated = await authenticate(jwt, privateKey);
            if (authenticated) return await attempt();
            else throw 'authentication failed';
          }
          return false;
        }
      };

      eduvault.db.remote.id = threadID.toString();
      const validConfig = await checkConfig(eduvault.db.remote);
      if (validConfig) {
        console.log('valid config');
        eduvault.db.remote.set(validConfig);
      } else {
        console.log('invalid config');
        const authenticated = await authenticate(jwt, privateKey);
        if (!authenticated) throw 'authentication failed';
      }

      const connected = await tryConnection();
      if (connected) return true;
      else throw 'error connecting to remote db';
    } catch (error) {
      console.log('startRemoteDB error:', error);
      throw error;
    }
  };
