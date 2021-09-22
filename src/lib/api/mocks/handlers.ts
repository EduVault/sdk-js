import { AsyncResponseResolverReturnType, MockedResponse, rest } from 'msw';

import { URL_API } from '../../../config';
import { ApiRes } from '../types';

export const getHandler = <T>(
  route: string,
  data: T,
  code = 200,
  withAuth = false
) => {
  return rest.get(URL_API + route, (_req, res, ctx) => {
    if (withAuth) sessionStorage.setItem('is-authenticated', 'true');
    const response: AsyncResponseResolverReturnType<MockedResponse<ApiRes<T>>> =
      res(ctx.status(code), ctx.json({ code, content: data }));
    return response;
  });
};

export const handlers = [getHandler('/ping', 'pong')];
