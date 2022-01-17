import EduVault, { AuthCheckRes } from '../../index';
import { ROUTES } from '../../config';

export const checkAuth = (eduvault: EduVault) => async () => {
  const res = await eduvault.api.get<AuthCheckRes>(ROUTES.AUTH_CHECK, true);
  if ('error' in res) return false;
  if (res.code !== 200 || res.content !== 'authenticated') return false;
  else return true;
};
