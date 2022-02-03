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
    const eduvault = new EduVault({ appID: '1' });

    let { db, error } = await eduvault.startLocalDB({ name: name + 1 });
    if (error) throw error;
    // await db?.delete();
    // const res = await eduvault.startLocalDB({ name: name + 1 });
    // if (res.error) throw error;
    // db = res.db;

    const Person = await db?.coreCollections.Person;
    if (!Person) throw 'person collection missing ';
    // console.log({ Person });
    const all = await Person?.find({});
    // console.log({ all });
    const count = await all.count();
    expect(count).toBe(0);
    // console.log({ count });
    // const saved = await Person?.create(newPerson).save();
    // console.log({ saved });
    // let findPerson = await Person?.findById('123');
    // console.log({ findPerson });
    // expect(findPerson?._id).toBe('123');
  });
  test('setupLocalListener', async () => {
    const eduvault = new EduVault({ appID: '1' });
    let { db, error } = await eduvault.startLocalDB({ name: name + 1 });
    if (error) throw error;
    const listener = jest.fn();
    db?.registerLocalListener(listener, ['person']);
    const Person = await db?.coreCollections.Person;
    if (!Person) throw 'person collection missing ';
    const all = await Person?.find({});
    // console.log({ all });
    const count = await all.count();
    expect(count).toBe(0);
    // console.log({ count });
    // const saved = await Person?.insert(newPerson);

    //   let findPerson = await Person?.findById('123');
    //   console.log({ findPerson });
    //   expect(findPerson?._id).toBe('123');
    //   expect(listener).toHaveBeenCalled();
  });
});
