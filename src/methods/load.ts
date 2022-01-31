import { PrivateKey, ThreadID } from '@textile/threaddb';

import { EduVault, LoginRedirectQueries } from '../index';
import { parseQueries } from '../api/helpers';
import { decryptAndTestKey } from '../utils';
import { decrypt, encrypt } from '../utils';
import { startCLientDB } from '.';

// import { ulid } from 'ulid';
export interface Credentials {
  privateKey: PrivateKey;
  threadID: ThreadID;
  jwt: string;
}

const startLocal = async (
  eduvault: EduVault,
  onReady: LoadOptions['onLocalReady'],
  privateKey: PrivateKey
) => {
  const { db, error } = await eduvault.startLocalDB({
    onReady,
    name: 'eduvault-' + privateKey.pubKey.toString(),
  });
  if (error || !db) throw error;
  return db;
};

const startRemote = async (
  eduvault: EduVault,
  threadID: ThreadID,
  jwt: string,
  privateKey: PrivateKey
) => {
  const remote = await eduvault.startRemoteDB({
    threadID,
    jwt,
    privateKey,
  });
  if (remote.error) throw remote.error;
  return remote;
};

/**
 * 
// TODO: refactor into small functions
 */
export const loadPasswordRedirect = async ({
  eduvault,
  pwEncryptedPrivateKey,
  clientTokenEncryptedKey,
  loginToken,
  pubKey,
  threadIDStr,
  options: { onReady, onLogin, onLocalReady, onError },
}: LoginRedirectQueries & {
  eduvault: EduVault;
  options: LoadOptions;
}) => {
  try {
    if (eduvault.log) console.log('loadPasswordRedirect');
    if (
      !pwEncryptedPrivateKey ||
      !clientTokenEncryptedKey ||
      !loginToken ||
      !pubKey ||
      !threadIDStr
    )
      throw 'login redirect query incomplete';
    const clientToken = localStorage.getItem('clientToken');
    if (!clientToken) throw 'no client token in localStorage';

    // decrypt keys with clientToken
    const privateKey = await decryptAndTestKey(
      clientTokenEncryptedKey,
      clientToken,
      pubKey
    );
    const keyStr = decrypt(clientTokenEncryptedKey, clientToken);
    if (!privateKey) throw 'error rehydrating key';

    // get jwt and cookie using loginToken
    const appAuthData = {
      loginToken: loginToken,
      appID: '1',
    };
    const res = await eduvault.api.appLogin(appAuthData);
    if ('error' in res) throw res.error;
    const { jwt } = res;
    if (!jwt) throw 'no jwt received';

    // this call is extra, but it checks to make sure the cookie works
    const loggedIn = await eduvault.api.checkAuth();
    if (!loggedIn) throw 'cookie authentication failed';
    if (onLogin) onLogin();

    const jwtEncryptedPrivateKey = encrypt(keyStr, jwt);
    localStorage.setItem('jwtEncryptedPrivateKey', jwtEncryptedPrivateKey);

    await startLocal(eduvault, onLocalReady, privateKey);

    const threadID = ThreadID.fromString(threadIDStr);
    if (!threadID || !threadID.isDefined()) throw 'error restoring threadID';

    await startRemote(eduvault, threadID, jwt, privateKey);

    if (onReady) onReady();
    // if (remote.getUserAuth) {
    //   startCLientDB({ getUserAuth: remote.getUserAuth });
    // }
  } catch (error) {
    if (eduvault.log) console.log('loadPasswordRedirect error');
    if (eduvault.log) console.error(error);
    if (onError) onError(JSON.stringify(error));
  }
};

export const loadReturningPerson = async ({
  eduvault,
  jwtEncryptedPrivateKey,
  options: { onReady, onLogin, onLocalReady, onError },
}: {
  eduvault: EduVault;
  jwtEncryptedPrivateKey: string;
  options: LoadOptions;
}) => {
  try {
    if (eduvault.log) console.log('loadReturningPerson');
    const pubKey = localStorage.getItem('pubKey');
    const threadIDstr = localStorage.getItem('threadIDStr');

    if (!pubKey) throw 'error pubKey not in localStorage';
    if (!threadIDstr) throw 'error threadID not in localStorage';
    const threadID = ThreadID.fromString(threadIDstr);
    if (!threadID || !threadID.isDefined()) throw 'error restoring threadID';

    const jwts = await eduvault.api.getJwt();

    if (!jwts) throw 'error getting jwts';
    if ('error' in jwts) throw jwts.error;
    const { jwt, oldJwt } = jwts;
    if (!jwt) throw 'no jwt received';

    if (onLogin) onLogin();

    const getKeyFromJwts = async ({
      jwt,
      oldJwt,
    }: {
      jwt: string;
      oldJwt: string;
    }) => {
      let privateKey: PrivateKey | null = null;
      try {
        privateKey = await decryptAndTestKey(
          jwtEncryptedPrivateKey,
          jwt,
          pubKey
        );
        if (!privateKey) throw 'first pass unable to rehydrate';
      } catch (error) {
        // try with last (old) jwt
        if (oldJwt) {
          privateKey = await decryptAndTestKey(
            jwtEncryptedPrivateKey,
            oldJwt,
            pubKey
          );
          if (!privateKey) {
            console.warn(error);
            privateKey = null;
            throw 'second pass unable to rehydrate';
          }
        }
      }
      return privateKey;
    };
    const privateKey = await getKeyFromJwts({ jwt, oldJwt });
    if (!privateKey) throw 'failed getting private key';

    await startLocal(eduvault, onLocalReady, privateKey);

    const remote = await startRemote(eduvault, threadID, jwt, privateKey);

    //doesn't seem to reach here
    if (eduvault.log)
      console.log('remote started, remote.getUserAuth', remote.getUserAuth);
    if (remote.getUserAuth) {
      startCLientDB({ getUserAuth: remote.getUserAuth });
    }
    if (onReady) onReady();
  } catch (error) {
    if (eduvault.log) console.log('loadReturningPerson error');
    if (eduvault.log) console.error(error);
    if (onError) onError(JSON.stringify(error));
  }
};

// if not returning and not login redirect. load failed. return 'unable to login/recover session';

export const loadOffline = (pwEncryptedPrivateKey: string) => {
  if (!pwEncryptedPrivateKey) throw 'no pwEncryptedPrivateKey';
  // prompt for password
  // decrypt
  // load database
};

export interface LoadOptions {
  onStart?: () => unknown;
  onReady?: () => unknown;
  onLocalReady?: () => unknown;
  onError?: (error: string) => unknown;
  onLogin?: () => unknown;
  log?: boolean;
}
export const load = (eduvault: EduVault) => async (options: LoadOptions) => {
  try {
    if (eduvault.log) console.log('load');
    if (options.onStart) options.onStart();

    /*
     * LOGIN REDIRECT
     */
    let queries;
    try {
      queries = parseQueries(
        window.location.href.split('?')[1]
      ) as LoginRedirectQueries;
    } catch (error) {
      if (eduvault.log) console.log('error loading queries:');
      if (eduvault.log) console.error(error);
    }
    // if (options.log) console.log({ queries });
    // call loading callbacks
    if (queries?.loginToken)
      return loadPasswordRedirect({
        eduvault,
        ...queries,
        options,
      });

    /*
     * RETURNING PERSON
     */
    const jwtEncryptedPrivateKey = localStorage.getItem(
      'jwtEncryptedPrivateKey'
    );
    const online = await eduvault.api.ping();

    // if (options.log) console.log({ jwtEncryptedPrivateKey, online });
    if (jwtEncryptedPrivateKey && online)
      return loadReturningPerson({
        eduvault,
        jwtEncryptedPrivateKey,
        options,
      });
  } catch (error) {
    console.log('loading error:');
    console.error(error);
    if (options.onError) options.onError(JSON.stringify(error));
  }
};
