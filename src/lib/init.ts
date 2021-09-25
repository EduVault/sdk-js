import EduVault from '../index';
// import { deckSchemaConfig } from '../types';
import { initOptions } from '../types';

/** Starts EduVault.
 * 1. If passed a buttonID, will call setupLoginButton() on the provided element ID
 * 2. Checks localStorage for person database credentials. If there is an error (credentials not found) you should redirect person to login page
 *  2a. Checks queries to see if returning from a login. If so, starts DB
 *  2b. If credentials were found, starts DB
 * */
export const init = (eduvault: EduVault, options: initOptions) => {
  eduvault.appID = options.appID;

  eduvault.log = options.log;
  if (options.log) console.log({ options });

  if (options.URL_API) eduvault.URL_API = options.URL_API;
  if (options.URL_APP) eduvault.URL_APP = options.URL_APP;

  // move load credentials to a method explicitly called
  // if (options.onLoadCredentialsStart)

  //   eduvault.onLoadCredentialsStart = options.onLoadCredentialsStart;
  // if (options.onLoadCredentialsReady)
  //   eduvault.onLoadCredentialsReady = options.onLoadCredentialsReady;
  // if (options.onLoadCredentialsError)
  //   eduvault.onLoadCredentialsError = options.onLoadCredentialsError;
  // if (options.onLocalReady) eduvault.onLocalReady = options.onLocalReady;
  // if (options.onLocalStart) eduvault.onLocalStart = options.onLocalStart;
  // if (options.onRemoteStart) eduvault.onRemoteStart = options.onRemoteStart;
  // if (options.onRemoteReady) eduvault.onRemoteReady = options.onRemoteReady;

  // move createButton to method
  // if (options.buttonID) eduvault.buttonID = options.buttonID;
  // if (options.redirectURL) eduvault.redirectURL = options.redirectURL;
  // if (eduvault.buttonID) {
  //   eduvault.setupLoginButton({
  //     buttonID: eduvault.buttonID,
  //     redirectURL: eduvault.redirectURL,
  //     appID: eduvault.appID,
  //     log: eduvault.log,
  //   });
  // }
  // if (!options.suppressInit) {
  //   const loadResult = await eduvault.loadCredentials({
  //     onStart: () => {
  //       eduvault.loadingStatus = 'Getting credentials';
  //       if (eduvault.onLoadCredentialsStart) eduvault.onLoadCredentialsStart();
  //     },
  //     onReady: (credentials) => {
  //       eduvault.loadingStatus = 'Got database credentials';
  //       if (eduvault.onLoadCredentialsReady)
  //         eduvault.onLoadCredentialsReady(credentials);
  //     },
  //     onError: (error) => {
  //       if (eduvault.onLoadCredentialsError)
  //         eduvault.onLoadCredentialsError(error);
  //     },
  //     appID: eduvault.appID,
  //     redirectURL: eduvault.redirectURL,
  //     log: eduvault.log,
  //   });
  //   if (eduvault.log) console.log({ loadResult });
  //   if (loadResult.error) {
  //     return { error: loadResult.error };
  //   }
  //   if (loadResult.privateKey && loadResult.threadID && loadResult.jwt) {
  //     eduvault.privateKey = loadResult.privateKey;
  //     eduvault.threadID = loadResult.threadID;
  //     eduvault.jwt = loadResult.jwt;

  //     const db = await eduvault.startLocalDB({
  //       onStart: () => {
  //         eduvault.loadingStatus = 'Starting local database';
  //         if (eduvault.onLocalStart) eduvault.onLocalStart();
  //       },
  //       onReady: (db) => {
  //         eduvault.loadingStatus = 'Local database ready';
  //         if (eduvault.onLocalReady) eduvault.onLocalReady(db);
  //       },
  //       collectionConfig: deckSchemaConfig,
  //     });
  //     if ('error' in db) return { error: db.error };
  //     if (!eduvault.jwt) return { error: 'jwt not found' };
  //     else {
  //       eduvault.db = db;
  //       eduvault.isLocalReady = true;
  //       const remoteStart = await eduvault.startRemoteRaw({
  //         onStart: () => {
  //           eduvault.loadingStatus = 'Starting remote database';
  //           if (eduvault.onRemoteStart) eduvault.onRemoteStart();
  //         },
  //         onReady: (db) => {
  //           eduvault.loadingStatus = 'Remote database ready';
  //           if (eduvault.onRemoteReady) eduvault.onRemoteReady(db);
  //         },
  //         db: eduvault.db,
  //         threadID: eduvault.threadID,
  //         jwt: eduvault.jwt,
  //         privateKey: eduvault.privateKey,
  //       });
  //       console.log({ remoteStart });
  //       if ('error' in remoteStart) return { error: remoteStart.error };
  //       else {
  //         eduvault.db = remoteStart.db;
  //         eduvault.remoteToken = remoteStart.token;
  //         console.log({ remoteToken: eduvault.remoteToken });
  //         return eduvault.db;
  //       }
  //     }
  //   } else return { error: loadResult };
  // } else return { error: 'Init Suppressed' };
};;;
