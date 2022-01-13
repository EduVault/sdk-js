import { rest } from 'msw';

import { URL_API } from '../../../config';

const postHandler = <T>(
  route: string,
  response: (req: any) => { content: T; code?: number }
) => {
  return rest.post(URL_API + route, (req, res, ctx) => {
    const returnedResponse = res(
      ctx.status(response(req).code ?? 200),
      ctx.json(response(req))
    );
    return returnedResponse;
  });
};

export default postHandler;
