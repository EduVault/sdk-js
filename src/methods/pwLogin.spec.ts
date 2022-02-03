import EduVault, { LoginButtonQueries } from '../index';
import { formatQueries } from '../api/helpers';
import { window } from '../setupTests';
import { password, username } from '../utils/testUtils';

const pwRedirectQueries: LoginButtonQueries = {
  redirectURL: 'http://localhost:3000/login',
  appID: '1',
  clientToken: 'asdfasdfasdf',
};

let eduvault: EduVault;
beforeEach(() => {
  window.location.href =
    'http://localhost:3000/login/?' + formatQueries(pwRedirectQueries);

  global.window = window as any;
  eduvault = new EduVault({ appID: '1' });
});

test('pwLogin gets correct response', async () => {
  const res = await eduvault.pwLogin({
    username,
    password,
  });

  if (typeof res === 'undefined') throw 'failed';

  // TODO: switch back to node for some tests. https://gist.github.com/thebuilder/15a084f74b1c6a1f163fc6254ad5a5ba

  // if ('error' in res) throw res;
  // expect(res.jwt.length).toBeGreaterThan(2);
  // expect(res.pwEncryptedPrivateKey.length).toBeGreaterThan(2);
  // expect(res.pubKey.length).toBeGreaterThan(2);
  // expect(res.threadIDStr.length).toBeGreaterThan(2);

  // // redirects user, builds correct queries
  // const redirectQueries = parseQueries(window.location.href.split('?')[1]);
  // expect(redirectQueries.clientTokenEncryptedKey.length).toBeGreaterThan(5);
  // expect(redirectQueries.loginToken.length).toBeGreaterThan(5);
  // expect(redirectQueries.pubKey.length).toBeGreaterThan(5);
  // expect(redirectQueries.pwEncryptedPrivateKey.length).toBeGreaterThan(5);
  // expect(redirectQueries.threadIDStr.length).toBeGreaterThan(5);
});

test('incomplete login', async () => {
  const res = await eduvault.pwLogin({
    username,
    password: null as any,
  });
  expect(res.error).toBe('login Client token not found');
});

test.todo('saves data to localStorage and app');
// can directly test handlePasswordSignInResponse()
