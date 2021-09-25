import { Buckets, PrivateKey } from '@textile/hub';
import { Database, JSONSchema, ThreadID } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';

import { api } from './api';
import { URL_API, URL_APP } from './config';
// import {
//   appLogin,
//   appRegister,
//   clearCollections,
//   devVerify,
//   getJWT,
//   personRegister,
// } from './lib/APICalls';
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
import { Credentials, loadCredentials as load } from './lib/loadCredentials';
import { setupLoginButton } from './lib/loginButton';
import { pwLogin } from './lib/pwLogin';
import { initOptions } from './types';

export * from './types';
export { startWorker } from './api/mocks/browser';
export { startServer as mockServer } from './api/mocks/server';
class EduVault {
  // config variables
  URL_APP = URL_APP;
  URL_API = URL_API;

  // init options
  appID = '1'; // 1 is the default home app
  log? = false;
  buttonID?: string;
  redirectURL?: string;

  // api
  api = api(this);

  // helpers
  online = false;
  privateKeyValid = () => {
    return this.privateKey?.canSign();
  };

  // methods
  pwLogin = pwLogin(this);
  // personRegister = personRegister(this);
  // devVerify = devVerify(this);
  // clearCollections = clearCollections(this);
  // appRegister = appRegister(this);
  // appLogin = appLogin(this);
  // getJWT = getJWT(this);
  // setupLoginButton = setupLoginButton(this);
  load = load(this);
  onLoadStart?: () => any;
  onLoadReady?: (credentials: Credentials) => any;
  onLoadError?: (error: string) => any;

  // status
  loadingStatus = 'not started';
  isSyncing = false;
  isLocalReady = false;
  isRemoteReady = false;

  // credentials
  privateKey?: PrivateKey;
  threadID?: ThreadID | null;
  jwt?: string;
  oldJwt?: string;
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
  setupLoginButton,
  startLocalDB,
  startRemoteDB,
  syncChanges,
};
