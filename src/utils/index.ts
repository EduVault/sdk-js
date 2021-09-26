import { PrivateKey, ThreadID } from '@textile/hub';

import EduVault from '../';
import { AuthType, PasswordLoginReq } from '../types';

import { encrypt, hash } from './encryption';
export * from './encryption';

export function rehydratePrivateKey(keyStr: string) {
  try {
    return PrivateKey.fromString(keyStr);
  } catch (error) {
    console.log('rehydratePrivateKey error', error);
    return null;
  }
}

/** Rehydrate keys from string and test if they match the provided public key */
export function testPrivateKey(
  privateKey: PrivateKey,
  pubKey: string
): boolean {
  try {
    const testMatching = privateKey.public.toString() === pubKey;
    const testWorking = privateKey.canSign();
    // console.log('key test result: ', testMatching, testWorking);
    if (!testMatching || !testWorking) return false;
    return true;
  } catch (error) {
    console.log({ error });
    return false;
  }
}

export const generatePrivateKey = async (): Promise<PrivateKey> => {
  return await PrivateKey.fromRandom();
};
/** formats a request for password authentication. Creates new keys for sign ups */
export const formatPasswordSignIn = async ({
  username,
  password,
  redirectURL,
  appID,
}: {
  username: string;
  password: string;
  redirectURL: string;
  appID: string;
}) => {
  const privateKey = await PrivateKey.fromRandom();
  const pubKey = await privateKey.public.toString();
  const newThreadID = await ThreadID.fromRandom();
  const threadIDStr = newThreadID.toString();

  const pwEncryptedPrivateKey = encrypt(privateKey.toString(), password);
  if (!pwEncryptedPrivateKey)
    return 'Could not encrypt private key with password';
  const clientToken = (Math.random() * 20).toString();
  const personAuthReq: PasswordLoginReq = {
    username,
    password: hash(password),
    pwEncryptedPrivateKey,
    threadIDStr,
    pubKey,
    redirectURL: redirectURL ?? 'http//:localhost',
    appID,
    clientToken,
  };

  return personAuthReq;
};



export const storePersistentAuthData = ({
  jwtEncryptedPrivateKey,
  pwEncryptedPrivateKey,
  threadIDStr,
  pubKey,
  authType,
}: {
  jwtEncryptedPrivateKey?: string;
  pwEncryptedPrivateKey?: string;
  threadIDStr?: string;
  pubKey?: string;
  authType?: AuthType;
}): void => {
  // console.log('storePersistentAuthData', {
  //   jwtEncryptedPrivateKey,
  //   pwEncryptedPrivateKey,
  //   threadIDStr,
  //   pubKey,
  //   authType,
  // });

  if (jwtEncryptedPrivateKey)
    localStorage.setItem('jwtEncryptedPrivateKey', jwtEncryptedPrivateKey);
  if (pwEncryptedPrivateKey)
    localStorage.setItem('pwEncryptedPrivateKey', pwEncryptedPrivateKey);
  if (threadIDStr) localStorage.setItem('threadIDStr', threadIDStr);
  if (pubKey) localStorage.setItem('pubKey', pubKey);
  if (authType) localStorage.setItem('authType', authType);
};

export const storeNonPersistentAuthData = ({
  eduvault,
  privateKey,
  jwt,
  oldJwt,
  threadID,
}: {
  eduvault: EduVault;
  privateKey?: PrivateKey;
  jwt?: string;
  oldJwt?: string;
  threadID?: ThreadID;
}) => {
  // console.log('storeNonPersistentAuthData', { privateKey, jwt, threadID });

  if (privateKey) eduvault.privateKey = privateKey;
  if (jwt) eduvault.jwt = jwt;
  if (oldJwt) eduvault.oldJwt = oldJwt;
  if (threadID) eduvault.threadID = threadID;
};

export const formatPreLoginFromExternalUrl = ({
  URL_APP,
  appID,
  redirectURL,
}: {
  URL_APP: string;
  appID: string;
  redirectURL: string;
}) => `${URL_APP}?app_id=${appID}&redirect_url=${redirectURL}`;

export const formatPostLoginRedirectURL = ({
  redirectURL,
  threadIDStr,
  pwEncryptedPrivateKey,
  encryptedPrivateKey,
  appLoginToken,
  pubKey,
}: {
  redirectURL: string;
  threadIDStr: string;
  pwEncryptedPrivateKey: string;
  encryptedPrivateKey: string;
  appLoginToken: string;
  pubKey: string;
}): string =>
  redirectURL +
  `?thread_id=${threadIDStr}&pw_encrypted_private_key=${pwEncryptedPrivateKey}&encrypted_private_key=${encryptedPrivateKey}&app_login_token=${appLoginToken}&pub_key=${pubKey}`;
