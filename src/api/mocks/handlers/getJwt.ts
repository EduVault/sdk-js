import { ROUTES } from '../../../config';

import getHandler from './getHandler';

const getJwt = getHandler(ROUTES.GET_JWT, {
  jwt: 'asdf',
  oldJwt: 'asdf',
});

export default getJwt;
