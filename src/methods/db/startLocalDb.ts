import { PrivateKey } from '@textile/hub';
import EduVault, {
  EduvaultDB,
  INote,
  IPerson,
  noteKey,
  personKey,
} from '../..';
import { getCollections } from './db';
export interface StartLocalDBOptions {
  version?: number;
  privateKey: PrivateKey;
  name?: string;
}

export const startLocalDB =
  (eduvault: EduVault) =>
  async ({ version = 1, privateKey, name }: StartLocalDBOptions) => {
    try {
      if (!name)
        name =
          'eduvault-' +
          privateKey.pubKey.toString().replaceAll(',', '').slice(0, 8);

      if (eduvault.log) console.log('starting local db', { version, name });

      const db = await new EduvaultDB({
        name,
        collections: [...getCollections()],
        eduvault,
      });
      db.open(version);

      await db.setCoreCollections({
        Note: db.collection<INote>(noteKey),
        Person: db.collection<IPerson>(personKey),
      });

      // console.log('started local db', { db });
      // const count = await db.collection('deck')?.count({});
      // console.log('count', { count });

      await eduvault.setDb(db);
      if (eduvault.log) console.log('started local db', { db });
      return { db };
    } catch (error) {
      return { error };
    }
  };
