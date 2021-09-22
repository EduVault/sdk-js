import EduVault, { GetJWTRes } from '..';
import { ROUTES } from '../config';

const getJwt = (self: EduVault) => async () => {
  const res = await self.api.get<GetJWTRes>(ROUTES.GET_JWT);
  if (res instanceof Error) return { error: res };
  if (res.code !== 200 || !res.content.jwt) return { error: res };
  else return res;
};
export default getJwt;
