import EduVault from './index';
const eduvault = new EduVault();
// import { APP_SECRET } from './config';
// granted, this is somewhat of an integration test, because it tests the API server as well
describe('sets up properly', () => {
  it('Connects to API and can detect server connection', async () => {
    const connected = await eduvault.pingServer();
    expect(connected).toBeTruthy();
  });
});
