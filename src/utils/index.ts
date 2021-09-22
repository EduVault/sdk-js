import { PrivateKey, ThreadID } from '@textile/threaddb';
import axios, { AxiosRequestConfig } from 'axios';

import { EduVault } from '../index';
import { PasswordLoginReq } from '../types';

import { encrypt, hash } from './encryption';
export * from './encryption';

export const pingServer = (self: EduVault) => async () => {
  try {
    const axiosOptions: AxiosRequestConfig = {
      url: self.URL_API + '/ping',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Proto': 'https',
      },
      method: 'GET',
      proxy: false,
    };
    // console.log('URL_API', self.URL_API);
    // console.log({ axiosOptions });
    const ping = await axios(axiosOptions);
    // const pingData = await ping.data;
    // console.log({ pingData, ping });
    return ping.status >= 200 && ping.status < 300;
  } catch (err) {
    console.log({ err });
    return false;
  }
};

export async function rehydratePrivateKey(keyStr: string) {
  try {
    return await PrivateKey.fromString(keyStr);
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
    console.log('key test result: ', testMatching, testWorking);
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
export const formatPasswordSignIn = async (options: {
  username?: string;
  password?: string;
  redirectURL?: string;
  appID?: string;
}) => {
  const privateKey = await PrivateKey.fromRandom();
  const pubKey = await privateKey.public.toString();
  const newThreadID = await ThreadID.fromRandom();
  const threadIDStr = newThreadID.toString();
  let error: string | null = '';
  if (!options.password) error += 'No password provided. ';
  if (!options.username) error += 'no username provided. ';
  let pwEncryptedPrivateKey;
  if (options.username && options.password)
    pwEncryptedPrivateKey = encrypt(privateKey.toString(), options.password);
  if (!pwEncryptedPrivateKey)
    error += 'Could not encrypt private key with password. ';

  const personAuthReq: PasswordLoginReq = {
    username: options.username,
    password: options.password ? hash(options.password) : undefined,
    pwEncryptedPrivateKey: pwEncryptedPrivateKey || undefined,
    threadIDStr,
    pubKey,
    redirectURL: options.redirectURL,
    appID: options.appID,
    error: error === '' ? undefined : error,
  };

  return personAuthReq;
};
