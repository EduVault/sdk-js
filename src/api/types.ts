// MAKE SURE THESE MATCH eduvault/core/api/src/routes/types

import { UserAuth } from '@textile/security';

export interface ApiRes<T> {
  content: T;
  code: number;
}

// LOGIN/SIGNUP FLOW
export interface LoginButtonQueries {
  appID: string; // to match redirectURL and verify request comes from registered app
  redirectURL: string;
  clientToken: string; // used to safely pass the private key back to the third party app. 3rd party decrypts with this later
}
export interface PasswordLoginReq {
  username: string;
  password: string;
  appID: string;
  threadIDStr: string;
  pwEncryptedPrivateKey: string; // encrypted with unhashed password
  pubKey: string; // to verify privKey
  redirectURL: string; //
}

export interface PasswordLoginRes {
  pwEncryptedPrivateKey: string;
  jwt: string;
  pubKey: string;
  threadIDStr: string;
  loginToken: string;
}

export interface LoginRedirectQueries {
  pwEncryptedPrivateKey: string;
  clientTokenEncryptedKey: string;
  loginToken: string;
  pubKey: string;
  threadIDStr: string;
}

export interface AppAuthReq {
  loginToken: string;
  appID: string;
}
export interface AppAuthRes {
  jwt: string;
  oldJwt: string;
}

// RETURNING PERSON
export interface GetJWTRes {
  jwt: string;
  oldJwt: string;
}

export interface LoginToken {
  data: { appID: string; personID: string };
  iat: number;
  exp: number;
}

export interface JWTToken {
  data: { appID: string; personID: string };
  iat: number;
  exp: number;
}

export interface WsMessageData {
  jwt?: string;
  type:
    | 'token-request'
    | 'token-response'
    | 'challenge-request'
    | 'challenge-response'
    | 'error';
  signature?: string | Uint8Array;
  error?: string;
  pubKey?: string;
  challenge?: any;
  personAuth?: UserAuth;
}

// TODO: app registration

export interface AppRegisterReq {
  appID: string;
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

// TODO: Dev registration
export interface DevVerifyReq {
  appSecret: string;
  devID: string;
}
