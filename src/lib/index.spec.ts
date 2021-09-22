import EduVault from '../';
const eduvault = new EduVault({ suppressInit: true });

test('apiGet', async () => {
  // can get data from a response
  const res = await eduvault.apiGet<'pong'>('/ping');
  if (res instanceof Error) throw 'ping error';
  expect(res.content).toBe('pong');
});

test('pingServer', async () => {
  const res = await eduvault.pingServer();
  if (!res) throw 'ping error';
  expect(res).toBeTruthy();
});
