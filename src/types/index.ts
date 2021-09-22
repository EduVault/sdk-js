import { Database } from '@textile/threaddb';

import { Credentials } from '../lib/credentials';

export * from './api';
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
