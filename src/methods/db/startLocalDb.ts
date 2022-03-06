import EduVault, {
  EduvaultDB,
  INote,
  IPerson,
  noteKey,
  personKey,
  StartLocalDBOptions,
} from '../..';
import { getCollections } from './db';

export const startLocalDB =
  (eduvault: EduVault) =>
  async ({ version = 1, onStart, onReady, name }: StartLocalDBOptions) => {
    try {
      if (eduvault.log) console.log('starting local db', { version });
      if (onStart) onStart();
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
      if (onReady) onReady(db);
      if (eduvault.log) console.log('started local db', { db });
      return { db };
    } catch (error) {
      return { error };
    }
  };
