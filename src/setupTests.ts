import domino from 'domino';

import { startServer } from './api/mocks/server';
import LocalStorageMock from './api/mocks/localStorage';

/** This is a hacky fix. We can't use jest-env jsdom because then msw won't work, so this helps get some dom features working */
const window = domino.createWindow('<div></div>');
global.window = window as any;
global.localStorage = new LocalStorageMock();

if (process.env.EV_SDK_TEST_ENV === 'unit') {
  const server = startServer();
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

export { window };
