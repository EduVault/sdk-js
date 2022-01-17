import EduVault from '../../index';
const eduvault = new EduVault({ appID: '1' });

test('getJwt', async () => {
  const res = await eduvault.api.checkAuth();

  expect(res).toBe(true);
});
