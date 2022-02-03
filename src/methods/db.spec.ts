import { EduvaultDB, getCollections } from './db';
import EduVault, { INote, IPerson, noteKey, personKey } from '../';

const name = 'unit-test-db';
const collections = [...getCollections()];

describe('EduvaultDB', () => {
  test('getCollections', () => {
    expect(collections[1].name).toBe('person');
    // uses json schema
    expect(collections[1].schema?.$schema).toBe(
      'http://json-schema.org/draft-07/schema#'
    );
  });
  test('start db, add eduvault custom methods', async () => {
    const eduvault = new EduVault({ appID: '1' });
    let db = new EduvaultDB({ name, eduvault, collections });
    await db.delete();
    db = new EduvaultDB({ name, eduvault, collections });
    db.open();

    // isSyncing
    expect(db.getIsSyncing()).toBe(false);
    db.setIsSyncing(true);
    expect(db.getIsSyncing()).toBe(true);

    // coreCollection
    db.setCoreCollections({
      Note: db.collection<INote>(noteKey),
      Person: db.collection<IPerson>(personKey),
    });
  });
  test('startLocalDB', async () => {
    const newPerson: IPerson = { _id: '123', username: '123@123.123' };

    const eduvault = new EduVault({ appID: '1' });

    const { db, error } = await eduvault.startLocalDB({ name });
    if (error) throw error;
    setTimeout(async () => {
      await db?.coreCollections.Person?.insert(newPerson);

      const Person = await db?.coreCollections.Person;
      if (!Person) throw 'person collection missing ';
      let findPerson = await Person?.findById('123');
      expect(findPerson?._id).toBe('123');
    }, 50);
  });
});
