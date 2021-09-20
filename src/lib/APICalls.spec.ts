// import { APP_SECRET } from '../config';
// import EduVault from '../index';
// import { username, password } from '../utils/testUtils';

// const eduvault = new EduVault();

// // granted, this is somewhat of an integration test, because it tests the API server as well
// describe('personRegister', () => {
//   it('Can register a person', async () => {
//     const person = await eduvault.personRegister({ username, password });
//     // console.log({ person });
//     expect(person).toBeTruthy();
//     expect(person?.data.pwEncryptedPrivateKey.length).toBeGreaterThan(30);
//     expect(person?.data.jwt.length).toBeGreaterThan(30);
//     expect(person?.data.pubKey.length).toBeGreaterThan(30);
//     expect(person?.data.threadIDStr.length).toBeGreaterThan(30);
//   });
// });

// describe('devVerify', () => {
//   it('Can verify a developer', async () => {
//     await eduvault.personRegister({ username, password });
//     const dev = await eduvault.devVerify(APP_SECRET, username);
//     // console.log({ dev });
//     expect(dev).toBeTruthy();
//     expect(dev?.data.pwEncryptedPrivateKey.length).toBeGreaterThan(30);
//   });
// });
// describe('appRegister', () => {
//   it('can register an app', async () => {
//     const appName = 'test app';
//     const appDesc = 'test app';
//     await eduvault.personRegister({ username, password });
//     await eduvault.devVerify(APP_SECRET, username);
//     const appInfo = await eduvault.appRegister(
//       username,
//       password,
//       appName,
//       appDesc
//     );
//     console.log({ appInfo });
//     // to do: types on this return
//     expect(appInfo).toBeTruthy();
//     if (appInfo?.devID) expect(appInfo?.devID).toBe(username);
//     else if (appInfo.error == 'app with same name exists')
//       expect(appInfo.appID.length).toBeGreaterThan(20);
//   });
// });
// describe('drop collections', () => {
//   it('can drop collections', async () => {
//     const res = await eduvault.clearCollections(APP_SECRET);

//     console.log({ clearCollectionsRes: res });
//     // to do: types on this return
//     expect(res).toBeTruthy();
//   });
// });
// // make an API that deletes the db if has app secret? or is that a really bad idea?
// // otherwise mock mongo
// // can I symlink the API into this project? then I can use supertest
