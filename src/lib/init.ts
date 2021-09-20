import EduVault from '../index';
import { deckSchemaConfig } from '../types';
import { initOptions } from '../types';
import { formatURLApi, formatURLApp, formatWSApi } from '../config';

/** Starts EduVault.
 * 1. If passed a buttonID, will call setupLoginButton() on the provided element ID
 * 2. Checks localStorage for person database credentials. If there is an error (credentials not found) you should redirect person to login page
 *  2a. Checks queries to see if returning from a login. If so, starts DB
 *  2b. If credentials were found, starts DB
 * */
export const init = async (self: EduVault, options: initOptions) => {
  if (options.appID) self.appID = options.appID;
  if (options.buttonID) self.buttonID = options.buttonID;
  if (options.redirectURL) self.redirectURL = options.redirectURL;
  self.log = options.log;
  if (options.onLoadCredentialsStart)
    self.onLoadCredentialsStart = options.onLoadCredentialsStart;
  if (options.onLoadCredentialsReady)
    self.onLoadCredentialsReady = options.onLoadCredentialsReady;
  if (options.onLoadCredentialsError)
    self.onLoadCredentialsError = options.onLoadCredentialsError;
  if (options.onLocalReady) self.onLocalReady = options.onLocalReady;
  if (options.onLocalStart) self.onLocalStart = options.onLocalStart;
  if (options.onRemoteStart) self.onRemoteStart = options.onRemoteStart;
  if (options.onRemoteReady) self.onRemoteReady = options.onRemoteReady;
  if (options.eduvaultHost) {
    self.HOST = options.eduvaultHost;
    self.URL_APP = formatURLApp(options.eduvaultHost);
    self.URL_API = formatURLApi(options.eduvaultHost);
    self.WS_API = formatWSApi(options.eduvaultHost);
  }
  if (options.log) console.log({ options });
  if (self.buttonID) {
    self.setupLoginButton({
      buttonID: self.buttonID,
      redirectURL: self.redirectURL,
      appID: self.appID,
      log: self.log,
    });
  }
  if (!options.suppressInit) {
    const loadResult = await self.loadCredentials({
      onStart: () => {
        self.loadingStatus = 'Getting credentials';
        if (self.onLoadCredentialsStart) self.onLoadCredentialsStart();
      },
      onReady: (credentials) => {
        self.loadingStatus = 'Got database credentials';
        if (self.onLoadCredentialsReady)
          self.onLoadCredentialsReady(credentials);
      },
      onError: (error) => {
        if (self.onLoadCredentialsError) self.onLoadCredentialsError(error);
      },
      appID: self.appID,
      redirectURL: self.redirectURL,
      log: self.log,
    });
    if (self.log) console.log({ loadResult });
    if (loadResult.error) {
      return { error: loadResult.error };
    }
    if (loadResult.privateKey && loadResult.threadID && loadResult.jwt) {
      self.privateKey = loadResult.privateKey;
      self.threadID = loadResult.threadID;
      self.jwt = loadResult.jwt;

      const db = await self.startLocalDB({
        onStart: () => {
          self.loadingStatus = 'Starting local database';
          if (self.onLocalStart) self.onLocalStart();
        },
        onReady: (db) => {
          self.loadingStatus = 'Local database ready';
          if (self.onLocalReady) self.onLocalReady(db);
        },
        collectionConfig: deckSchemaConfig,
      });
      if ('error' in db) return { error: db.error };
      if (!self.jwt) return { error: 'jwt not found' };
      else {
        self.db = db;
        self.isLocalReady = true;
        const remoteStart = await self.startRemoteRaw({
          onStart: () => {
            self.loadingStatus = 'Starting remote database';
            if (self.onRemoteStart) self.onRemoteStart();
          },
          onReady: (db) => {
            self.loadingStatus = 'Remote database ready';
            if (self.onRemoteReady) self.onRemoteReady(db);
          },
          db: self.db,
          threadID: self.threadID,
          jwt: self.jwt,
          privateKey: self.privateKey,
        });
        console.log({ remoteStart });
        if ('error' in remoteStart) return { error: remoteStart.error };
        else {
          self.db = remoteStart.db;
          self.remoteToken = remoteStart.token;
          console.log({ remoteToken: self.remoteToken });
          return self.db;
        }
      }
    } else return { error: loadResult };
  } else return { error: 'Init Suppressed' };
};
