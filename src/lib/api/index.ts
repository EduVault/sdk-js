import axios, { AxiosRequestConfig } from 'axios';

import { EduVault } from '../../index';

import { ApiRes } from './types';

type Methods = 'GET' | 'POST';

export const apiReq =
  (self: EduVault) =>
  async <T>(
    route: string,
    method: Methods,
    data?: any,
    withCredentials = false
  ) => {
    try {
      const axiosOptions: AxiosRequestConfig = {
        url: self.URL_API + route,
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-Proto': 'https',
        },
        method: method,
        withCredentials,
        data,
        // proxy: false,
      };
      // console.log({ axiosOptions });
      const res = await axios(axiosOptions);
      if (res.status < 200 || res.status >= 300) throw res;
      const resData: ApiRes<T> = res.data;
      // console.log({ resData, res });
      if (resData.code < 200 || resData.code >= 300) throw resData;
      return resData;
    } catch (error) {
      console.log({ apiReqError: error });
      const res = new Error(String(error));
      return res;
    }
  };
/** @param route should start with slash */
export const apiGet =
  (self: EduVault) =>
  async <T>(route: string, withCredentials = false) => {
    const req = apiReq(self);
    return await req<T>(route, 'GET', undefined, withCredentials);
  };

/** @param route should start with slash */
export const apiPost =
  (self: EduVault) =>
  async <T>(route: string, data: any, withCredentials = false) => {
    const req = apiReq(self);
    return await req<T>(route, 'POST', data, withCredentials);
  };

export const pingServer = (self: EduVault) => async () => {
  const res = await self.apiGet<'pong'>('/ping');
  if (res instanceof Error) return false;
  if (res.code === 200 && res.content == 'pong') return true;
  return false;
};
