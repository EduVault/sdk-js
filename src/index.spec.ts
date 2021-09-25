import EduVault from './index';
const eduvault = new EduVault({ appID: '1' });
// import { APP_SECRET } from './config';
// granted, this is somewhat of an integration test, because it tests the API server as well
describe('sets up properly', () => {
  it('Connects to API and can detect server connection', async () => {
    const connected = await eduvault.api.ping();
    expect(connected).toBeTruthy();
  });
});
