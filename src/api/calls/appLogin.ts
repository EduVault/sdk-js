import EduVault, { AppAuthReq, AppAuthRes } from '../../';
import { ROUTES } from '../../config';

export const appLogin = (eduvault: EduVault) => async (data: AppAuthReq) => {
  const res = await eduvault.api.post<AppAuthRes>(ROUTES.APP_AUTH, data, true);
  if ('error' in res) return { error: res.error };
  else if (res.code !== 200 || !res.content.jwt) return { error: res };
  else return res.content;
};
