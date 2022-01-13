import { rest } from 'msw';

import { URL_API } from '../../../config';

const getHandler = <T>(
  route: string,
  responseData: T,
  code = 200
  // withAuth = true
) => {
  return rest.get(URL_API + route, (_req, res, ctx) => {
    // if (withAuth) sessionStorage.setItem('is-authenticated', 'true');
    const response = res(
      ctx.status(code),
      ctx.json({ code, content: responseData })
    );
    return response;
  });
};
export default getHandler;
