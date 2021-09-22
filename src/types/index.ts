import { Database } from '@textile/threaddb';

import { Credentials } from '../lib/credentials';

export * from '../api/types';
export * from './model';

/** suppressInit will only load the URL_API into the API calls, toggle log (if provided) */
export interface initOptions {
  appID?: string;
  URL_API?: string;
  URL_APP?: string;
  suppressInit?: boolean;
  buttonID?: string;
  redirectURL?: string;
  log?: boolean;
  onLoadCredentialsStart?: () => any;
  onLoadCredentialsReady?: (credentials: Credentials) => any;
  onLoadCredentialsError?: (error: string) => any;
  onLocalStart?: () => any;
  onLocalReady?: (db: Database) => any;
  onRemoteStart?: () => any;
  onRemoteReady?: (db: Database) => any;
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
