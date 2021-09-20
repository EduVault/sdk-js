import { PrivateKey } from '@textile/threaddb';
import axios, { AxiosRequestConfig } from 'axios';

import { EduVault } from '../index';

export const isServerOnline = (self: EduVault) => async () => {
  try {
    const axiosOptions: AxiosRequestConfig = {
      url: self.URL_API + '/ping',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Proto': 'https',
      },
      method: 'GET',
      baseURL: self.HOST,
      proxy: false,
    };
    // console.log('URL_API', self.URL_API);
    console.log({ axiosOptions });
    const ping = await axios(axiosOptions);
    const pingData = await ping.data;
    console.log({ pingData, ping });
    return ping.status >= 200 && ping.status < 300;
  } catch (err) {
    console.log({ err });
    return false;
  }
};
// export const checkConnectivityClearBacklog = (self: EduVault) => {
//   return () => {
//     const timer = setInterval(() => {
//       console.log(
//         'checking connectivity, backlog, isBrowserOnline',
//         !!self.backlog,
//         self.isBrowserOnline()
//       );
//       if (!self.backlog) {
//         clearInterval(timer);
//         return;
//       } else if (self.isBrowserOnline()) {
//         self.sync(self.backlog);
//         self.backlog = undefined;
//         clearInterval(timer);
//       } else return;
//     }, 3000);
//   };
// };

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
