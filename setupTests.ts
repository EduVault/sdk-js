import domino from 'domino';

import { server } from './src/api/mocks/server';
import LocalStorageMock from './src/api/mocks/localStorage';

/** This is a hacky fix. We can't use jest-env jsdom because then msw won't work, so this helps get some dom features working */
const window = domino.createWindow('<div></div>');
global.window = window as any;
global.localStorage = new LocalStorageMock();

if (process.env.TEST_ENV === 'unit') {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
