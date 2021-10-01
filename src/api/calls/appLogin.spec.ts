import EduVault from '../..';
import { formatPasswordSignIn } from '../../utils';
import { password, username } from '../../utils/testUtils';
const eduvault = new EduVault({ appID: '1' });

test('valid login', async () => {
  // from password sign in
  const validLogin = await formatPasswordSignIn({
    username,
    password,
    redirectURL: 'http://localhost',
    appID: '1',
  });
  if ('error' in validLogin) throw validLogin;
  const res = await eduvault.api.passwordLogin(validLogin);
  if ('error' in res) throw 'login error';

  const appAuthData = {
    loginToken: res.content.loginToken,
    appID: '1',
  };
  const appLoginRes = await eduvault.api.appLogin(appAuthData);
  if ('error' in appLoginRes) throw 'login error';
  expect(appLoginRes.content.jwt.length).toBeGreaterThanOrEqual(3);
});
