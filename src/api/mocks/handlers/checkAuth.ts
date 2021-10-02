import { ROUTES } from '../../../config';

import getHandler from './getHandler';

const getJwt = getHandler(ROUTES.AUTH_CHECK, 'authenticated');

export default getJwt;
