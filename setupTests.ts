import domino from 'domino';

import { server } from './src/api/mocks/server';
import LocalStorageMock from './src/api/mocks/localStorage';

/** This is a hacky fix. We can't use jest-env jsdom because then msw won't work, so this helps get some dom features working */
const window = domino.createWindow('<div></div>');
global.window = window as any;
global.localStorage = new LocalStorageMock();

// Establish API mocking before all tests.
beforeAll(() => {
  server.listen();
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished.
afterAll(() => server.close());
