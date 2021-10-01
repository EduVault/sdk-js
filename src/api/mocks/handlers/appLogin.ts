import { ROUTES } from '../../../config';
import { AppAuthReq, AppAuthRes } from '../../types';

import postHandler from './postHandler';

const response = (req: { body: AppAuthReq }) => {
  let code = 200;

  let content: AppAuthRes | string = {
    jwt: '123123123123',
    oldJwt: '321321321',
  };
  if (!req.body.loginToken) {
    content = 'no loginToken';
    code = 403;
  }
  if (!req.body.appID) {
    content = 'no appID';
    code = 403;
  }
  return { content, code };
};

const AppAuth = postHandler(ROUTES.APP_AUTH, response);

export default AppAuth;
