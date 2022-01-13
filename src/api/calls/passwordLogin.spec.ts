import EduVault from '../..';
import { formatPasswordSignIn } from '../../utils';
import { password, username } from '../../utils/testUtils';
const eduvault = new EduVault({ appID: '1' });

test('valid passwordLogin', async () => {
  const validLogin = await formatPasswordSignIn({
    username,
    password,
    redirectURL: 'http://localhost',
    appID: '1',
  });
  if ('error' in validLogin) throw validLogin;
  const res = await eduvault.api.passwordLogin(validLogin);
  if ('error' in res) throw 'login error';
  expect(res.loginToken.length).toBeGreaterThanOrEqual(3);
  expect(res.jwt.length).toBeGreaterThanOrEqual(3);
});

test.todo('invalid login');
