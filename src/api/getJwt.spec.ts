import EduVault from '..';
const eduvault = new EduVault({ suppressInit: true });

test('getJwt', async () => {
  const res = await eduvault.api.getJwt();
  if ('error' in res) throw res;
  expect(res.content.jwt.length).toBeGreaterThan(3);
});
