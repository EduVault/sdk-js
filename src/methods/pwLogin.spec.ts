import EduVault from '..';
import { password, username } from '../utils/testUtils';

const eduvault = new EduVault({ appID: '1' });

test('pwLogin', async () => {
  const res = await eduvault.pwLogin({
    username,
    password,
    redirectURL: 'http://localhost:3000/login',
  });
  if (typeof res === 'undefined') throw 'failed';
  if ('error' in res) throw res;
  expect(res.jwt.length).toBeGreaterThan(2);
  expect(res.pwEncryptedPrivateKey.length).toBeGreaterThan(2);
  expect(res.pubKey.length).toBeGreaterThan(2);
  expect(res.threadIDStr.length).toBeGreaterThan(2);
});
