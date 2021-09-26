import { ThreadID } from '@textile/hub';

import { ROUTES } from '../../../config';
import { decrypt, encrypt, rehydratePrivateKey } from '../../../utils';
import { password } from '../../../utils/testUtils';
import { PasswordLoginReq, PasswordLoginRes } from '../../types';

import postHandler from './postHandler';

const response = (req: { body: PasswordLoginReq }) => {
  let code = 200;
  // console.log(req.body);
  const privateKeyStr = decrypt(req.body.pwEncryptedPrivateKey, password);
  // console.log({ privateKeyStr });
  const privateKey = rehydratePrivateKey(privateKeyStr);

  let content: PasswordLoginRes | string = {
    pwEncryptedPrivateKey: encrypt(privateKey!.toString(), password)!,
    jwt: 'jwt',
    pubKey: req.body.pubKey,
    threadIDStr: ThreadID.fromRandom().toString(),
    appLoginToken: 'appLoginToken',
    decryptToken: 'decryptToken',
  };
  if (!req.body.appID) {
    content = 'no appID';
    code = 403;
  }
  if (!req.body.password || !req.body.username) {
    content = 'no username password';
    code = 403;
  }
  return { content, code };
};

const passwordLogin = postHandler(ROUTES.PASSWORD_AUTH, response);

export default passwordLogin;
