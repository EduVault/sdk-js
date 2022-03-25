import EduVault from '../..';
import { Client } from '@textile/hub';
import { textileTokenStorageName } from './db';
import { Context } from '@textile/context';

export const startClientDB =
  (eduvault: EduVault) =>
  async ({ jwt, privateKey }: { jwt: string; privateKey: any }) => {
    const oldToken = localStorage.getItem(textileTokenStorageName);

    const testAndSetClient = async (client: Client) => {
      if (!eduvault.db) throw 'no db';
      const threads = await client.listThreads();
      // console.log({ threads });
      if (threads.length > 0) {
        eduvault.db.client = client;
      } else throw 'no threads';
    };

    if (oldToken) {
      try {
        // console.log('using old token');
        const ctx = new Context().withToken(oldToken);
        const client = new Client(ctx);
        return await testAndSetClient(client);
      } catch (error) {
        const getUserAuth = eduvault.loginWithChallenge(jwt, privateKey);
        const client = await Client.withUserAuth(getUserAuth);
        return await testAndSetClient(client);
      }
    } else {
      const getUserAuth = eduvault.loginWithChallenge(jwt, privateKey);
      const client = await Client.withUserAuth(getUserAuth);
      return await testAndSetClient(client);
    }
  };

// don't return getUserAuth, instead pass jwt and private key to startClientDB.
// create a helper startup option "syncOnClientChange" that will listen for changes from the client
// and check for actual updated, and then start a sync. This is probably easier than trying to listen to client changes and then setting the local db.
// the only problem is that the user will need to enforce using updatedAt instead of the unreliable _mod.
// maybe we can use a dexie middleware to do update _updatedAt on every change
