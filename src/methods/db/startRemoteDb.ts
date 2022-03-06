import { Remote } from '@textile/threaddb';
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
        console.log('authenticating');
        const userAuth = await getUserAuth();
        await db.remote.setUserAuth(userAuth);
        token = await db.remote.authorize(privateKey);
        localStorage.setItem(
          remoteConfigStorageName,
          JSON.stringify(db.remote.config)
        );
        localStorage.setItem(textileTokenStorageName, token);
        return token;
      };

      const tryConnection = async () => {
        try {
          const initialized = await db.remote.initialize(threadID.toString());
          console.log('initialized', initialized);

          if (initialized !== threadID.toString())
            throw new Error('initialized wrong thread');
          return true;
        } catch (error: any) {
          // this error means that the thread is already initialized
          if (error.message.includes('E11000')) {
            console.log('thread already initialized');
            const DBInfo = await db.remote.info();
            console.log({ DBInfo });
            const notes = await db.remote.pull('note');
            console.log({ notes });
            return true;
          }
          console.error(error);
          return false;
        }
      };

      db.remote.id = threadID.toString();
      const validConfig = await checkConfig(db.remote);

      if (validConfig) {
        db.remote.set(validConfig);

        const res = await tryConnection();
        if (res) {
          if (onReady) onReady(db);
          return { db, remote: db.remote, token, getUserAuth };
        }
      }
      await authenticate();
      const res = await tryConnection();
      if (res) {
        if (onReady) onReady(db);
        return { db, remote: db.remote, token, getUserAuth };
      } else throw 'error connecting to remote db';
    } catch (error) {
      console.log({ error });
      return { error };
    }
  };
