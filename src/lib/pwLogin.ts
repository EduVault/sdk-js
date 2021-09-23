import { PrivateKey, ThreadID } from '@textile/hub';

import { EduVault } from '..';
import {
  decrypt,
  encrypt,
  formatPasswordSignIn,
  formatPostLoginRedirectURL,
  rehydratePrivateKey,
  storeNonPersistentAuthData,
  storePersistentAuthData,
  testPrivateKey,
} from '../utils';

export const pwLogin =
  (eduvault: EduVault) =>
  async ({
    username,
    password,
    redirectURL,
  }: {
    password: string;
    username: string;
    redirectURL: string;
  }) => {
    const appID = eduvault.appID;

    const loginData = await formatPasswordSignIn({
      username,
      password,
      redirectURL,
      appID,
    });

    const loginRes = await eduvault.api.passwordLogin(loginData);
    if ('error' in loginRes) return console.log({ error: loginRes.error });

    const encryptedPrivateKey = await handlePasswordSignInResponse({
      eduvault,
      ...loginRes.content,
      password,
    });

    const redirectUrlWithQueries = formatPostLoginRedirectURL({
      redirectURL,
      encryptedPrivateKey,
      ...loginRes.content,
    });

    window.location.assign(redirectUrlWithQueries);

    return { ...loginRes.content, encryptedPrivateKey, redirectUrlWithQueries };
  };

const handlePasswordSignInResponse = async (loginRes: {
  eduvault: EduVault;
  pwEncryptedPrivateKey: string;
  threadIDStr: string;
  pubKey: string;
  decryptToken: string;
  password: string;
  jwt: string;
}) => {
  const {
    eduvault,
    password,
    pwEncryptedPrivateKey,
    threadIDStr,
    pubKey,
    decryptToken,
    jwt,
  } = loginRes;

  const retrievePrivateKey = async (
    pwEncryptedPrivateKey: string,
    password: string
  ) => {
    const keyStr = decrypt(pwEncryptedPrivateKey, password);
    if (!keyStr) throw 'Could not decrypt PrivateKey';
    const retrievedKey = rehydratePrivateKey(keyStr);
    if (!retrievedKey || !testPrivateKey(retrievedKey, pubKey))
      throw 'Could not retrieve PrivateKey';
    return retrievedKey;
  };
  // const getJwts = async () => {
  //   const jwts = await eduvault.api.getJwt();
  //   if (!jwts || 'error' in jwts || !jwts.content.jwt)
  //     throw 'could not get jwt';
  //   return jwts.content;
  // };
  const encryptPrivKeyWithJwt = (privateKey: PrivateKey, jwt: string) => {
    const jwtEncryptedPrivateKey = encrypt(privateKey.toString(), jwt);
    if (!jwtEncryptedPrivateKey)
      throw 'error encrypting jwtEncryptedPrivateKey';
    return jwtEncryptedPrivateKey;
  };
  const encryptPrivKeyWithDecryptToken = (
    privateKey: PrivateKey,
    decryptToken: string
  ) => {
    const encryptedPrivateKey = encrypt(privateKey.toString(), decryptToken);
    if (!encryptedPrivateKey) throw 'error encrypting encryptedPrivateKey';
    return encryptedPrivateKey;
  };

  const privateKey = await retrievePrivateKey(pwEncryptedPrivateKey, password);
  // const { jwt, oldJwt } = await getJwts();
  const jwtEncryptedPrivateKey = encryptPrivKeyWithJwt(privateKey, jwt);
  const encryptedPrivateKey = encryptPrivKeyWithDecryptToken(
    privateKey,
    decryptToken
  );
  const threadID = ThreadID.fromString(threadIDStr);

  storePersistentAuthData({
    jwtEncryptedPrivateKey,
    pwEncryptedPrivateKey,
    threadIDStr,
    pubKey,
    authType: 'password',
  });
  storeNonPersistentAuthData({ eduvault, privateKey, jwt, threadID });

  return encryptedPrivateKey;
};
