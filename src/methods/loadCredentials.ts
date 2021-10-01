import { PrivateKey, ThreadID } from '@textile/threaddb';

import { EduVault, LoginRedirectQueries } from '../';
import { parseQueries } from '../api/helpers';
import { decryptAndTestKey } from '../utils';
import { decrypt, encrypt } from '../utils';
// import { ulid } from 'ulid';
export interface Credentials {
  privateKey: PrivateKey;
  threadID: ThreadID;
  jwt: string;
}

export const loadPasswordRedirect = async ({
  eduvault,
  pwEncryptedPrivateKey,
  clientTokenEncryptedKey,
  loginToken,
  pubKey,
  threadIDStr,
  onReady,
}: LoginRedirectQueries & {
  eduvault: EduVault;
  onReady?: (res: unknown) => unknown;
}) => {
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
  console.log({ clientTokenEncryptedKey, clientToken, pubKey });
  const key = await decryptAndTestKey(
    clientTokenEncryptedKey,
    clientToken,
    pubKey
  );
  const keyStr = decrypt(clientTokenEncryptedKey, clientToken);
  if (!key) throw 'error rehydrating key';

  // get jwt and cookie using loginToken
  const appAuthData = {
    loginToken: loginToken,
    appID: '1',
  };
  const res = await eduvault.api.appLogin(appAuthData);
  if ('error' in res) throw res.error;
  // encrypt key with jwt and store in localStorage
  const jwtEncryptedPrivateKey = encrypt(keyStr, res.content.jwt);
  localStorage.setItem('jwtEncryptedPrivateKey', jwtEncryptedPrivateKey);
  console.log({ res });
  // TODO: load database

  alert('YAY! key can sign ' + key.canSign());
  if (onReady) onReady({ key });
};

export const loadReturningPerson = async (
  eduvault: EduVault,
  jwtEncryptedPrivateKey: string,
  onReady?: (result: any) => unknown
) => {
  const pubKey = localStorage.getItem('pubKey');
  if (!pubKey) throw 'error pubKey not in localStorage';
  let jwts;
  try {
    jwts = await eduvault.api.getJwt();
  } catch (error) {
    console.log(error);
  }
  if (!jwts) throw 'error getting jwts';
  if ('error' in jwts) throw jwts.error;
  if (!jwts.content.jwt) throw 'no jwt received';
  let key: PrivateKey;
  try {
    key = await decryptAndTestKey(
      jwtEncryptedPrivateKey,
      jwts.content.jwt,
      pubKey
    );
    if (!key) throw 'first pass unable to rehydrate';
  } catch (error) {
    key = await decryptAndTestKey(
      jwtEncryptedPrivateKey,
      jwts.content.jwt,
      pubKey
    );
    if (!key) throw 'second pass unable to rehydrate';
    console.warn(error);
  }

  // TODO: load database
  alert('key can sign ' + key.canSign());
  if (onReady) onReady({ key });
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
  onReady?: (result: unknown) => unknown;
  onError?: (error: string) => unknown;
  log?: boolean;
}
export const load =
  (eduvault: EduVault) =>
  async ({ onStart, onReady, onError, log }: LoadOptions) => {
    try {
      eduvault.loadingStatus = 'loading';
      if (onStart) onStart();

      /*
       * LOGIN REDIRECT
       */
      let queries;
      try {
        queries = parseQueries(
          window.location.href.split('?')[1]
        ) as LoginRedirectQueries;
      } catch (error) {
        console.log('error loading queries', error);
      }
      if (log) console.log({ queries });
      // call loading callbacks
      if (queries?.loginToken)
        return loadPasswordRedirect({ eduvault, onReady, ...queries });

      /*
       * RETURNING PERSON
       */
      const jwtEncryptedPrivateKey = localStorage.getItem(
        'jwtEncryptedPrivateKey'
      );
      const online = await eduvault.api.ping();

      if (log) console.log({ jwtEncryptedPrivateKey, online });
      if (jwtEncryptedPrivateKey && online)
        return loadReturningPerson(eduvault, jwtEncryptedPrivateKey, onReady);
    } catch (error) {
      console.error(error);
      if (onError) onError(JSON.stringify(error));
    }
  };
