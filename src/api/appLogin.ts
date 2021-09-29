import EduVault, { AppAuthReq, AppAuthRes } from '..';
import { ROUTES } from '../config';

const passwordLogin = (eduvault: EduVault) => async (options: AppAuthReq) => {
  const res = await eduvault.api.post<AppAuthRes>(ROUTES.APP_AUTH, options);
  if (res instanceof Error) return { error: res };
  if (res.code !== 200 || !res.content.jwt) return { error: res };
  else return res;
};
export default passwordLogin;
