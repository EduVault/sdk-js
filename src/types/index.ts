// import { Database } from '@textile/threaddb';

import { Collection } from '@textile/threaddb';
import { Instance } from '@textile/threaddb/dist/cjs/local/document';
import { INote, IPerson } from '../collections';

// import { Credentials } from '../lib/loadCredentials';

export * from '../api/types';
export * from '../collections';
export interface CoreCollections {
  Note?: Collection<INote>;
  Person?: Collection<IPerson>;
}
/** suppressInit will only load the URL_API into the API calls, toggle log (if provided) */
export interface initOptions {
  appID: string;
  log?: boolean;
  URL_API?: string;
  URL_APP?: string;
  URL_WS_API?: string;
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

export type Instances<T> = (T & {
  _id: string;
} & Instance)[];
