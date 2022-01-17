import { Buckets, PrivateKey } from '@textile/hub';
import { JSONSchema, ThreadID } from '@textile/threaddb';
import {
  Collection,
  CollectionConfig,
} from '@textile/threaddb/dist/cjs/local/collection';

import { api } from './api';
import { URL_API, URL_APP, URL_WS_API } from './config';
import {
  EduvaultDB,
  init,
  load,
  loginWithChallenge,
  pwLogin,
  setupLoginButton,
  startLocalDB,
  startRemoteDB,
} from './methods';
import { initOptions, Instances } from './types';

export * from './types';
export { startWorker } from './api/mocks/browser';
export { startServer as mockServer } from './api/mocks/server';

class EduVault {
  // config variables
  URL_APP = URL_APP;
  URL_API = URL_API;
  URL_WS_API = URL_WS_API;

  // init options
  appID = '1'; // 1 is the default home app
  log? = false;
  buttonID?: string;
  redirectURL?: string;

  // api
  api = api(this);

  // helpers
  privateKeyValid = () => {
    return this.privateKey?.canSign();
  };

  // methods
  pwLogin = pwLogin(this);
  load = load(this);
  setupLoginButton = setupLoginButton(this);

  // credentials
  privateKey?: PrivateKey;
  threadID?: ThreadID | null;
  jwt?: string;
  oldJwt?: string;

  // db and db auth
  db?: EduvaultDB;
  setDb = (db: EduvaultDB) => (this.db = db);
  loginWithChallenge = loginWithChallenge(this);
  startLocalDB = startLocalDB(this);
  startRemoteDB = startRemoteDB(this);
  constructor(options: initOptions) {
    init(this, options);
  }
}
export default EduVault;
export {
  EduVault,
  EduvaultDB,
  Buckets,
  Instances,
  JSONSchema,
  CollectionConfig,
  Collection,
  setupLoginButton,
  startLocalDB,
  startRemoteDB,
};
