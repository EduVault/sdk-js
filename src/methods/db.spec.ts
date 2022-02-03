import { EduvaultDB, getCollections } from './db';
import EduVault, { INote, IPerson, noteKey, personKey } from '../';

const name = 'unit-test-db';
const collections = [...getCollections()];
const newPerson: IPerson = { _id: '123', username: '123@123.123' };

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
    const eduvault = new EduVault({ appID: '12' });

    let { db, error } = await eduvault.startLocalDB({ name });
    if (error) throw error;

    const Person = await db?.coreCollections.Person;
    if (!Person) throw 'person collection missing ';
    await Person?.clear();
    let count = await Person?.find({}).count();
    expect(count).toBe(0);
    await Person?.create(newPerson).save();
    count = await Person?.find({}).count();
    expect(count).toBe(1);
    let findPerson = await Person?.findById('123');
    expect(findPerson?._id).toBe('123');
  });
  test('setupLocalListener', async () => {
    const eduvault = new EduVault({ appID: '1' });
    let { db, error } = await eduvault.startLocalDB({ name });
    if (error) throw error;
    const listenSpy = jest.fn();

    db?.registerLocalListener(async (req, res, tableName) => {
      console.log('table updated', tableName);
      listenSpy();
    });
    const Person = await db?.coreCollections.Person;
    await Person?.clear();
    if (!Person) throw 'person collection missing ';
    expect(listenSpy).toHaveBeenCalledTimes(1);
    let count = await Person?.find({}).count();
    expect(count).toBe(0);
    // await Person?.create(newPerson).save();
    await db?.collection('person')?.create(newPerson).save();
    expect(listenSpy).toHaveBeenCalledTimes(3);

    count = await Person?.find({}).count();
    expect(count).toBe(1);
  });
  test('onSyncingChange', async () => {
    const eduvault = new EduVault({ appID: '1' });
    let { db, error } = await eduvault.startLocalDB({ name });
    if (error) throw error;
    if (!db) throw 'no db';
    const called = jest.fn();
    db.onSyncingChange = () => called();
    db.setIsSyncing(false);
    db.setIsSyncing(true);
    expect(called).toHaveBeenCalledTimes(1);
    db.setIsSyncing(false);
    expect(called).toHaveBeenCalledTimes(2);
  });
});
