import { setupWorker } from 'msw';

import { handlers } from './handlers';

export const startWorker = () => setupWorker(...handlers);
