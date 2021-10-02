import axios, { AxiosRequestConfig } from 'axios';

import { EduVault } from '../index';

import { appLogin, checkAuth, getJwt, passwordLogin } from './calls/';
import { ApiRes } from './types';

type Methods = 'GET' | 'POST';

export const apiReq = (eduvault: EduVault) =>
  async function <T>(
    route: string,
    method: Methods,
    data?: unknown,
    withCredentials = false
  ) {
    try {
      const axiosOptions: AxiosRequestConfig = {
        url: eduvault.URL_API + route,
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-Proto': 'https',
          // 'Access-Control-Allow-Headers': 'x-requested-with',
        },
        method: method,
        withCredentials,
        data,
        // proxy: false,
      };
      // console.log({ axiosOptions });
      const res = await axios(axiosOptions);
      if (!res.data || res.status < 200 || res.status >= 300) throw res;
      const resData: ApiRes<T> = res.data;
      // console.log({ resData, res });
      if (resData.code < 200 || resData.code >= 300) throw resData;
      return resData;
    } catch (error) {
      console.log({ apiReqError: error });
      return { error };
    }
  };

/** @param route should start with slash */
export const get =
  (eduvault: EduVault) =>
  async <T>(route: string, withCredentials = false) => {
    const req = apiReq(eduvault);
    const res = await req<T>(route, 'GET', undefined, withCredentials);
    return res;
  };

/** @param route should start with slash */
export const post =
  (eduvault: EduVault) =>
  async <T>(route: string, data: unknown, withCredentials = false) => {
    const req = apiReq(eduvault);
    return await req<T>(route, 'POST', data, withCredentials);
  };

export const ping = (eduvault: EduVault) => async () => {
  const res = await eduvault.api.get<'pong'>('/ping');
  if ('error' in res) return false;
  if (res.code === 200 && res.content == 'pong') return true;
  return false;
};

export const api = (self: EduVault) => ({
  get: get(self),
  post: post(self),
  ping: ping(self),
  passwordLogin: passwordLogin(self),
  getJwt: getJwt(self),
  appLogin: appLogin(self),
  checkAuth: checkAuth(self),
});
