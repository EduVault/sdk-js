import EduVault from '..';
import { formatPasswordSignIn } from '../utils';
import { password, username } from '../utils/testUtils';
const eduvault = new EduVault({ suppressInit: true });

test('valid passwordLogin', async () => {
  const validLogin = await formatPasswordSignIn({
    username,
    password,
    redirectURL: 'http://localhost',
    appID: '1',
  });
  const res = await eduvault.api.passwordLogin(validLogin);
  if ('error' in res) throw 'login error';
  expect(res.content.appLoginToken.length).toBeGreaterThanOrEqual(3);
  expect(res.content.decryptToken.length).toBeGreaterThanOrEqual(3);
  expect(res.content.jwt.length).toBeGreaterThanOrEqual(3);
});

test.todo('invalid login');
