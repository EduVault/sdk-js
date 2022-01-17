import EduVault, { GetJWTRes } from '../../index';
import { ROUTES } from '../../config';

export const getJwt = (eduvault: EduVault) => async () => {
  const res = await eduvault.api.get<GetJWTRes>(ROUTES.GET_JWT, true);
  if ('error' in res) return { error: res.error };
  if (res.code !== 200 || !res.content.jwt) return { error: res };
  else return res.content;
};
