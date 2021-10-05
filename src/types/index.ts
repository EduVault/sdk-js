export * from '../api/types';
export * from '../collections';
export * from './db';
/** suppressInit will only load the URL_API into the API calls, toggle log (if provided) */
export interface initOptions {
  appID: string;
  log?: boolean;
  URL_API?: string;
  URL_APP?: string;
  URL_WS_API?: string;
}

export type AuthType =
  | 'google'
  | 'facebook'
  | 'dotwallet'
  | 'password'
  | 'metamask'
  | 'default';
