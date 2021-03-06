import EduVault from '../index';
const eduvault = new EduVault({ appID: '1' });

test('get', async () => {
  // can get data from a response
  const res = await eduvault.api.get<'pong'>('/ping');
  if ('error' in res) throw 'ping error';
  expect(res.content).toBe('pong');
});

test('ping', async () => {
  const res = await eduvault.api.ping();
  if (!res) throw 'ping error';
  expect(res).toBeTruthy();
});
