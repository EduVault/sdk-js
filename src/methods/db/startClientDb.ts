import EduVault from '../..';
import { UserAuth as PersonAuth, Client } from '@textile/hub';
import { textileTokenStorageName } from './db';
import { Context } from '@textile/context';

export const startClientDB =
  (eduvault: EduVault) =>
  async ({ getUserAuth }: { getUserAuth: () => Promise<PersonAuth> }) => {
    const oldToken = localStorage.getItem(textileTokenStorageName);
    let client: Client;

    const testAndSetClient = async () => {
      if (!eduvault.db) throw 'no db';
      const threads = await client.listThreads();
      // console.log({ threads });
      if (threads.length > 0) {
        eduvault.db.client = client;
        return client;
      } else throw 'no threads';
    };

    if (oldToken) {
      try {
        // console.log('using old token');
        const ctx = new Context().withToken(oldToken);
        client = new Client(ctx);
        return await testAndSetClient();
      } catch (error) {
        client = await Client.withUserAuth(getUserAuth);
        return await testAndSetClient();
      }
    } else {
      client = await Client.withUserAuth(getUserAuth);
      return await testAndSetClient();
    }
  };
