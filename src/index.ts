import { Buckets, PrivateKey } from '@textile/hub';
import { Database, JSONSchema, ThreadID } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';
import { formatURLApi, formatURLApp, formatWSApi, isTestEnv } from './config';

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
  startLocalDB,
  startLocalWrapped,
  startRemoteDB,
  startRemoteWrapped,
  sync,
  syncChanges,
  loginWithChallenge,
} from './lib/db';
import { init } from './lib/init';
import { setupLoginButton } from './lib/loginButton';
import { initOptions } from './types';
import {
  // checkConnectivityClearBacklog,
  isServerOnline,
} from './utils';

class EduVault {
  log? = false;
  isOnline = isServerOnline(this);

  privateKeyValid = () => {
    return this.privateKey?.canSign();
  };

  personRegister = personRegister(this);
  devVerify = devVerify(this);
  clearCollections = clearCollections(this);
  appRegister = appRegister(this);
  appLogin = appLogin(this);
  getJWT = getJWT(this);

  appID?: string;

  setupLoginButton = setupLoginButton(this);
  buttonID?: string;
  redirectURL?: string;
  HOST = !isProdEnv() || isTestEnv() ? 'localhost' : 'eduvault.org';
  URL_APP = formatURLApp(this.HOST);
  URL_API = formatURLApi(this.HOST);
  WS_API = formatWSApi(this.HOST);
  db?: Database;
  loadingStatus = 'not started';
  isSyncing = false;
  isLocalReady = false;
  isRemoteReady = false;
  loadCredentials = loadCredentials(this);
  onLoadCredentialsStart?: () => any;
  onLoadCredentialsReady?: (credentials: Credentials) => any;
  onLoadCredentialsError?: (error: string) => any;
  privateKey?: PrivateKey;
  threadID?: ThreadID | null;
  jwt?: string;
  remoteToken?: string;

  loginWithChallenge = loginWithChallenge(this);

  startLocalDB = startLocalWrapped(this);
  onLocalStart?: () => any;
  onLocalReady?: (db: Database) => any;

  startRemoteRaw = startRemoteDB(this);
  startRemoteDB = startRemoteWrapped(this);

  onRemoteStart?: () => any;
  onRemoteReady?: (db: Database) => any;

  backlog: string | undefined;
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
  isServerOnline,
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
