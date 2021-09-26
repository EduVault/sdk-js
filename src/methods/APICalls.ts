// import axios, { AxiosRequestConfig } from 'axios';

// import { ROUTES } from '../config';
// import {
//   AppAuthReq,
//   AppAuthRes,
//   DevVerifyReq,
//   PasswordLoginRes,
//   PasswordLoginReq,
//   AppRegisterReq,
// } from '../types';
// import { hash, formatPasswordSignIn } from '../utils';
// import { EduVault } from '../index';

// export const personRegister =
//   (eduvault: EduVault) =>
//   async (options: {
//     username: string | undefined;
//     password: string | undefined;
//     redirectURL?: string | undefined;
//     appID?: string | undefined;
//   }) => {
//     try {
//       const pwSigninData = await formatPasswordSignIn(options);
//       if (pwSigninData.error) throw pwSigninData.error;
//       const postData: PasswordLoginReq = pwSigninData;
//       const axiosOptions: AxiosRequestConfig = {
//         url: eduvault.URL_API + ROUTES.PASSWORD_AUTH,
//         headers: {
//           'Content-Type': 'application/json',
//           'X-Forwarded-Proto': 'https',
//         },
//         data: postData,
//         method: 'POST',
//         proxy: false,
//       };
//       const res = await axios(axiosOptions);
//       const resData: PasswordLoginRes = res.data;
//       // console.log('/auth/password', resData);
//       return resData;
//     } catch (error) {
//       console.log({ error });
//       return null;
//     }
//   };

// export const devVerify =
//   (eduvault: EduVault) => async (appSecret: string, devID: string) => {
//     try {
//       const postData: DevVerifyReq = { appSecret, devID };
//       const options: AxiosRequestConfig = {
//         url: eduvault.URL_API + ROUTES.DEV_VERIFY,
//         headers: {
//           'Content-Type': 'application/json',
//           'X-Forwarded-Proto': 'https',
//         },
//         data: postData,
//         method: 'POST',
//       };
//       const res = await axios(options);
//       const resData = res.data;
//       // console.log('/dev/verify', resData);
//       return resData;
//     } catch (error) {
//       console.log({ error });
//       return null;
//     }
//   };
// export const clearCollections =
//   (eduvault: EduVault) => async (appSecret: string) => {
//     try {
//       const postData = { appSecret };
//       const options: AxiosRequestConfig = {
//         url: eduvault.URL_API + '/drop-collections',
//         headers: {
//           'Content-Type': 'application/json',
//           'X-Forwarded-Proto': 'https',
//         },
//         data: postData,
//         method: 'POST',
//       };
//       const res = await axios(options);
//       const resData = res.data;
//       console.log('drop database data', resData);
//       return resData;
//     } catch (error) {
//       console.log({ error });
//       return null;
//     }
//   };
// export const appRegister =
//   (eduvault: EduVault) =>
//   async (
//     username: string,
//     password: string,
//     name: string,
//     description?: string,
//     appID?: string
//   ) => {
//     try {
//       const postData: AppRegisterReq = {
//         username,
//         password: hash(password),
//         name,
//         description,
//         appID,
//       };
//       const options: AxiosRequestConfig = {
//         url: eduvault.URL_API + ROUTES.APP_REGISTER,
//         withCredentials: true,
//         headers: {
//           'Content-Type': 'application/json',
//           'X-Forwarded-Proto': 'https',
//         },
//         data: postData,
//         method: 'POST',
//       };
//       const res = await axios(options);
//       const resData = res.data;
//       console.log('app register result', resData);
//       if (!resData || !resData.data) return null;
//       else return resData.data;
//     } catch (error) {
//       // if (error.response?.data?.data?.error !== 'app with same name exists')
//       console.log({ error });
//       return error;
//     }
//   };

// export const appLogin =
//   (eduvault: EduVault) => async (appLoginToken: string, appID: string) => {
//     try {
//       const data: AppAuthReq = { appLoginToken, appID };
//       const options: AxiosRequestConfig = {
//         url: eduvault.URL_API + '/auth/app',
//         withCredentials: true,
//         headers: {
//           'Content-Type': 'application/json',
//           'X-Forwarded-Proto': 'https',
//         },
//         data,
//         method: 'POST',
//       };
//       const res = await axios(options);
//       const resData: AppAuthRes = res.data;
//       console.log('app-login', res.data);
//       if (!resData || !resData.jwt) return null;
//       else return resData;
//     } catch (error) {
//       console.log({ error });
//       return null;
//     }
//   };

// export const getJWT = (eduvault: EduVault) => async () => {
//   try {
//     const options: AxiosRequestConfig = {
//       url: eduvault.URL_API + ROUTES.GET_JWT,
//       withCredentials: true,
//       headers: {
//         'X-Forwarded-Proto': 'https',
//       },
//       method: 'GET',
//     };
//     const res = await axios(options);
//     const resData: {
//       data: {
//         jwt: string;
//         oldJwt: string | null;
//       };
//     } = res.data;
//     console.log('get-jwt', res.data);
//     if (!resData || !resData.data || !resData.data.jwt) return null;
//     else return resData.data;
//   } catch (err) {
//     console.log(err);
//     return null;
//   }
// };
