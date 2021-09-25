// import { Database } from '@textile/threaddb';

// import { Credentials } from '../lib/loadCredentials';

export * from '../api/types';
export * from './model';

/** suppressInit will only load the URL_API into the API calls, toggle log (if provided) */
export interface initOptions {
  appID: string;
  log?: boolean;
  URL_API?: string;
  URL_APP?: string;
  // buttonID?: string;
  // redirectURL?: string;
  // onLoadCredentialsStart?: () => any;
  // onLoadCredentialsReady?: (credentials: Credentials) => any;
  // onLoadCredentialsError?: (error: string) => any;
  // onLocalStart?: () => any;
  // onLocalReady?: (db: Database) => any;
  // onRemoteStart?: () => any;
  // onRemoteReady?: (db: Database) => any;
}

export type AuthType =
  | 'google'
  | 'facebook'
  | 'dotwallet'
  | 'password'
  | 'metamask'
  | 'default';

export interface AuthState {
  loggedIn: boolean;
  authType: AuthType;
  jwt?: string;
  pubKey?: string;
  privateKey?: string;
  jwtEncryptedPrivateKey?: string;
  threadID?: string;
  threadIDStr?: string;
}
