import EduVault from './index';
const eduvault = new EduVault();
// import { APP_SECRET } from './config';
// granted, this is somewhat of an integration test, because it tests the API server as well
describe('sets up properly', () => {
  // it('loads env file', () => {
  //   expect(APP_SECRET).not.toBe('VerySecretPassword');
  // });
  it('Connects to API and can detect server connection', async () => {
    const connected = await eduvault.isServerOnline();
    expect(connected).toBeTruthy();
  });
});
