import EduVault, { PasswordLoginReq, PasswordLoginRes } from '..';
import { ROUTES } from '../config';

const passwordLogin =
  (eduvault: EduVault) => async (options: PasswordLoginReq) => {
    const res = await eduvault.api.post<PasswordLoginRes>(
      ROUTES.PASSWORD_AUTH,
      options
    );
    if (res instanceof Error) return { error: res };
    if (res.code !== 200 || !res.content.appLoginToken) return { error: res };
    else return res;
  };
export default passwordLogin;
