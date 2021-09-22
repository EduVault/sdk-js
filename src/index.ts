import { Buckets, PrivateKey } from '@textile/hub';
import { Database, JSONSchema, ThreadID } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';
import { URL_API, URL_APP } from './config';
import { apiGet, apiPost, apiReq } from './lib/api';

import {
  appLogin,
  appRegister,
  clearCollections,
  devVerify,
  getJWT,
  personRegister,
} from './lib/APICalls';
import { Credentials, loadCredentials } from './lib/credentials';
import {
  // debouncedSync,
  loginWithChallenge,
  startLocalDB,
  startLocalWrapped,
  startRemoteDB,
  startRemoteWrapped,
  sync,
  syncChanges,
} from './lib/db';
import { init } from './lib/init';
import { setupLoginButton } from './lib/loginButton';
import { initOptions } from './types';
import {
  // checkConnectivityClearBacklog,
  pingServer,
} from './utils';
export * from './types';
class EduVault {
  // config variables
  URL_APP = URL_APP;
  URL_API = URL_API;

  // init options
  log? = false;
  appID?: string;
  buttonID?: string;
  redirectURL?: string;

  // api
  apiReq = apiReq(this);
  apiGet = apiGet(this);
  apiPost = apiPost(this);
  pingServer = pingServer(this);

  // helpers
  isOnline = pingServer(this);
  privateKeyValid = () => {
    return this.privateKey?.canSign();
  };

  // methods
  personRegister = personRegister(this);
  devVerify = devVerify(this);
  clearCollections = clearCollections(this);
  appRegister = appRegister(this);
  appLogin = appLogin(this);
  getJWT = getJWT(this);
  setupLoginButton = setupLoginButton(this);
  loadCredentials = loadCredentials(this);
  onLoadCredentialsStart?: () => any;
  onLoadCredentialsReady?: (credentials: Credentials) => any;
  onLoadCredentialsError?: (error: string) => any;

  // status
  loadingStatus = 'not started';
  isSyncing = false;
  isLocalReady = false;
  isRemoteReady = false;

  // credentials
  privateKey?: PrivateKey;
  threadID?: ThreadID | null;
  jwt?: string;
  remoteToken?: string;

  // db and db auth
  db?: Database;
  loginWithChallenge = loginWithChallenge(this);
  startLocalDB = startLocalWrapped(this);
  onLocalStart?: () => any;
  onLocalReady?: (db: Database) => any;
  startRemoteRaw = startRemoteDB(this);
  startRemoteDB = startRemoteWrapped(this);
  onRemoteStart?: () => any;
  onRemoteReady?: (db: Database) => any;

  syncChanges = syncChanges(this);
  // checkConnectivityClearBacklog = checkConnectivityClearBacklog(this);
  sync = sync(this);

  constructor(options?: initOptions) {
    if (options) {
      init(this, options);
    }
  }
}
export default EduVault;
export {
  EduVault,
  Database,
  Buckets,
  JSONSchema,
  CollectionConfig,
  Collection,
  pingServer,
  appRegister,
  devVerify,
  clearCollections,
  loadCredentials,
  setupLoginButton,
  startLocalDB,
  startRemoteDB,
  syncChanges,
  personRegister,
};
