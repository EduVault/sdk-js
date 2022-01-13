import { ThreadID } from '@textile/hub';

import {
  EduVault,
  LoginButtonQueries,
  LoginRedirectQueries,
  PasswordLoginRes,
} from '..';
import { formatQueries, parseQueries } from '../api/helpers';
import {
  decryptAndTestKey,
  encrypt,
  formatPasswordSignIn,
  storeNonPersistentAuthData,
  storePersistentAuthData,
} from '../utils';

export const pwLogin =
  (eduvault: EduVault) =>
  async ({ username, password }: { password: string; username: string }) => {
    try {
      // collect queries from third party app. thats why we don't grab appID from eduvault.
      const { appID, redirectURL, clientToken } = parseQueries(
        window.location.href.split('?')[1]
      ) as LoginButtonQueries;
      if (!clientToken) throw 'login Client token not found';
      if (!appID) throw 'login appID not found';
      if (!clientToken) throw 'login clientToken';

      // format login data
      const loginData = await formatPasswordSignIn({
        username,
        password,
        redirectURL,
        appID,
      });

      if ('error' in loginData) throw loginData.error;

      // send login
      const loginRes = await eduvault.api.passwordLogin(loginData);
      if ('error' in loginRes) throw loginRes.error;

      // handle login, generate outgoing redirect
      const { redirectUrlWithQueries, error } =
        await handlePasswordSignInResponse({
          eduvault,
          ...loginRes,
          password,
          clientToken,
          redirectURL,
        });

      if (error) throw error;
      if (!redirectUrlWithQueries) throw 'error building redirect queries';

      window.location.assign(redirectUrlWithQueries);

      return {
        ...loginRes,
        redirectUrlWithQueries,
      };
    } catch (error) {
      return { error };
    }
  };

interface HandlePasswordSignInResponse extends PasswordLoginRes {
  eduvault: EduVault;
  password: string;
  clientToken: string;
  redirectURL: string;
}

/** store data and retrieve and encrypt keys */
const handlePasswordSignInResponse = async ({
  eduvault,
  pwEncryptedPrivateKey,
  threadIDStr,
  pubKey,
  password,
  jwt,
  clientToken,
  redirectURL,
  loginToken,
}: HandlePasswordSignInResponse) => {
  try {
    const privateKey = await decryptAndTestKey(
      pwEncryptedPrivateKey,
      password,
      pubKey
    );

    const jwtEncryptedPrivateKey = encrypt(privateKey, jwt);
    if (!jwtEncryptedPrivateKey) throw 'error encrypting key with jwt';
    const clientTokenEncryptedKey = encrypt(privateKey.toString(), clientToken);
    if (!clientTokenEncryptedKey) throw 'error encrypting key';

    const threadID = ThreadID.fromString(threadIDStr);

    storePersistentAuthData({
      jwtEncryptedPrivateKey,
      pwEncryptedPrivateKey,
      threadIDStr,
      pubKey,
      authType: 'password',
    });
    storeNonPersistentAuthData({ eduvault, privateKey, jwt, threadID });

    const queryData: LoginRedirectQueries = {
      pwEncryptedPrivateKey,
      loginToken,
      pubKey,
      threadIDStr,
      clientTokenEncryptedKey,
    };

    const queries = formatQueries(queryData);
    const redirectUrlWithQueries = redirectURL + '?' + queries;

    return { redirectUrlWithQueries };
  } catch (error) {
    return { error };
  }
};
