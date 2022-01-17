import EduVault, { PasswordLoginReq, PasswordLoginRes } from '../../index';
import { ROUTES } from '../../config';

export const passwordLogin =
  (eduvault: EduVault) => async (options: PasswordLoginReq) => {
    const res = await eduvault.api.post<PasswordLoginRes>(
      ROUTES.PASSWORD_AUTH,
      options
    );
    if ('error' in res) return { error: res.error };
    if (res.code !== 200 || !res.content.loginToken) return { error: res };
    else return res.content;
  };
