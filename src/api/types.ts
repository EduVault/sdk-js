// MAKE SURE THESE MATCH eduvault/core/api/src/types

export interface IApp {
  _id: string;
  appID: string;
  devID: string;
  name: string;
  description?: string;
  authorizedDomains?: string[];
  persons?: string[];
}
export interface AppAndTokenData extends IApp {
  id: string;
  decryptToken: string;
}

export interface AppTokenData {
  data: { id: string; decryptToken: string };
  iat: number;
  exp: number;
}

export interface ApiRes<T> {
  content: T;
  code: number;
}
export interface PasswordLoginReq {
  username?: string;
  password?: string;
  threadIDStr?: string;
  pwEncryptedPrivateKey?: string;
  pubKey?: string;
  redirectURL?: string;
  appID: string;
  error?: string;
}

export interface PasswordLoginRes {
  pwEncryptedPrivateKey: string;
  jwt: string;
  pubKey: string;
  threadIDStr: string;
  appLoginToken?: string;
  decryptToken?: string;
}

export interface AppAuthReq {
  appLoginToken: string;
  appID: string;
}
export interface AppAuthRes {
  jwt: string;
  oldJwt: string;
  decryptToken: string;
}
export interface AppRegisterReq {
  appID?: string;
  username: string;
  password: string;
  name: string;
  description?: string;
}
export interface AppUpdateReq {
  username: string;
  password: string;
  appID: string;
  name?: string;
  description?: string;
  authorizedDomains?: string[];
  persons?: string[];
}
export interface DevVerifyReq {
  appSecret: string;
  devID: string;
}
