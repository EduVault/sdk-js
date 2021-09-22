import { PrivateKey, ThreadID } from '@textile/threaddb';

import { rehydratePrivateKey, testPrivateKey } from '../utils';
import { decrypt, encrypt } from '../utils';
import { EduVault } from '..';
// import { ulid } from 'ulid';
export interface Credentials {
  privateKey: PrivateKey;
  threadID: ThreadID;
  jwt: string;
}

export interface LoadCredentialsOptions {
  onStart?: () => any;
  onReady?: (credentials: Credentials) => any;
  onError?: (error: string) => any;
  redirectURL?: string;
  appID?: string;
  log?: boolean;
}

/**
 * Checks queries for login redirect info:
 *  appLoginToken, threadID, pwEncryptedPrivateKey, pubKey, encryptedPrivateKey
 *  see: app/src/store/utils/index => formatOutRedirectURL for what is being sent
 * Checks local storage for jwtEncryptedPrivateKey
 *
 * flow:
 *  first time login:
 *    uses appLoginToken to start session and get jwt and decode token. uses decode token to decrypt keys.
 *  returning login:
 *    uses jwtEncryptedPrivateKey from localStorage,
 *    then uses cookie to get JWT from server to decrypt privateKey
 *  in both cases:
 *    use jwt to get userAuth  (for now must be online. look into whether userAuth can be in localStorage too)
 *    userAuth to start DB */
export const loadCredentials =
  (eduvault: EduVault) =>
  async ({
    redirectURL,
    appID,
    log = false,

    onStart,
    onReady,
    onError,
  }: LoadCredentialsOptions) => {
    try {
      if (onStart) onStart();
      // const online = await eduvault.online();
      const online = true;
      // console.log({ online})
      // if (!online) {
      //   setTimeout(async () => (online = await eduvault.ping()), 300);
      // }
      const queries = new URL(window.location.href).searchParams;

      /** Returning login */
      // should also have threadID, pubKey, etc. (check app)
      // to do, save persistent data
      const jwtEncryptedPrivateKey = localStorage.getItem(
        'jwtEncryptedPrivateKey'
      );
      let threadIDStr = localStorage.getItem('threadIDStr');
      let pwEncryptedPrivateKey = localStorage.getItem('pwEncryptedPrivateKey');
      let pubKey = localStorage.getItem('pubKey');
      const returningLogin =
        jwtEncryptedPrivateKey && threadIDStr && pwEncryptedPrivateKey && pubKey
          ? true
          : false;

      /** New login */
      let appLoginToken;
      let encryptedPrivateKey;
      if (!returningLogin) {
        threadIDStr = queries.get('thread_id');
        pwEncryptedPrivateKey = queries.get('pw_encrypted_private_key');
        appLoginToken = queries.get('app_login_token');
        encryptedPrivateKey = queries.get('encrypted_private_key');
        pubKey = queries.get('pub_key');
      }

      let threadID: ThreadID | undefined;
      if (threadIDStr)
        try {
          threadID = ThreadID.fromString(threadIDStr);
        } catch (error) {
          console.log({ errorDecodingThreadIDStr: error });
        }
      if (log) {
        queries.forEach((val, key) => console.log(key + ': ' + val));
        console.log({
          appID,
          redirectURL,
          online,
          threadIDStr,
          threadID,
          pwEncryptedPrivateKey,
          jwtEncryptedPrivateKey,
          appLoginToken,
          pubKey,
        });
      }

      let jwts = null;
      if (online && returningLogin) {
        const jwtsCall = await eduvault.api.getJwt();
        if ('error' in jwtsCall) throw 'could not get jwt';
        jwts = jwtsCall.content;
        if (log) console.log({ jwts });
        if (jwtEncryptedPrivateKey && jwts && jwts.jwt && threadID && pubKey) {
          console.log({ jwtEncryptedPrivateKey, jwts });
          let keyStr = decrypt(jwtEncryptedPrivateKey, jwts.jwt);
          let usedOldJwt = false;
          // use oldJWT if it didn't work
          if (!keyStr && jwts.oldJwt)
            keyStr = decrypt(jwtEncryptedPrivateKey, jwts.oldJwt);
          if (keyStr) {
            usedOldJwt = true;
          } else {
            if (onError) onError('unable to decrypt keys');
            return { error: 'unable to decrypt keys' };
          }

          const privateKey = rehydratePrivateKey(keyStr);
          console.log({ privateKey });

          //should we test the keys better? might require getting ID
          if (privateKey && testPrivateKey(privateKey, pubKey)) {
            if (usedOldJwt) {
              const newJwtEncryptedPrivateKey = encrypt(keyStr, jwts.jwt);
              if (newJwtEncryptedPrivateKey)
                localStorage.setItem(
                  'jwtEncryptedPrivateKey',
                  newJwtEncryptedPrivateKey
                );
            }
            if (onReady) onReady({ privateKey, threadID, jwt: jwts.jwt });
            return { privateKey, threadID, jwt: jwts.jwt };
          } else {
            if (onError) onError('private key could not be rehydrated');
            return { error: 'private key could not be rehydrated' };
          }
        } else {
          if (onError) onError('incomplete returning login info');
          return { error: 'incomplete returning login info' };
        }
      } else if (online && !returningLogin) {
        if (
          appLoginToken &&
          appID &&
          encryptedPrivateKey &&
          pubKey &&
          threadID &&
          threadIDStr &&
          pwEncryptedPrivateKey
        ) {
          const appLoginRes = null;
          // const appLoginRes = await eduvault.appLogin(appLoginToken, appID);
          if (!appLoginRes) {
            if (onError) onError('appLogin failed');
            return { error: 'appLogin failed' };
          }

          const { jwt, decryptToken } = appLoginRes;
          let keyStr;
          let privateKey;
          try {
            keyStr = decrypt(encryptedPrivateKey, decryptToken);
            privateKey = rehydratePrivateKey(keyStr);
          } catch (error) {
            console.log();
          }
          if (privateKey && testPrivateKey(privateKey, pubKey)) {
            const newJwtEncryptedPrivateKey = encrypt(keyStr, jwt);
            if (newJwtEncryptedPrivateKey)
              localStorage.setItem(
                'jwtEncryptedPrivateKey',
                newJwtEncryptedPrivateKey
              );
            localStorage.setItem(
              'pwEncryptedPrivateKey',
              pwEncryptedPrivateKey
            );
            localStorage.setItem('threadIDStr', threadIDStr);
            localStorage.setItem('pubKey', pubKey);
            if (onReady) onReady({ privateKey, threadID, jwt });
            return { privateKey, threadID, jwt };
          } else {
            if (onError) onError('private key could not be rehydrated');
            return { error: 'private key could not be rehydrated' };
          }
        } else {
          if (onError) onError('incomplete appLogin redirect data');
          return { error: 'incomplete appLogin redirect data' };
        }
      } else if (!online && returningLogin) {
        // create a password input
        console.log('use your password to unlock the database while offline');
        // this mode will only allow local use, can't connect to remote.
        // connect local and connect remote must be separate functions
        if (onError) onError('offline unlocking not yet available');
        return { error: 'offline unlocking not yet available' };
      } else {
        if (onError) onError('no credentials found');
        return { error: 'no credentials found' };
      }
    } catch (error) {
      if (onError) onError(JSON.stringify(error));
      return { error };
    }
  };
