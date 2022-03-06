import { ulid } from 'ulid';

import { EduVault, LoginButtonQueries } from '../';
import { formatQueries } from '../api/helpers';
export interface LoginButtonOptions {
  buttonID: string;
  redirectURL?: string;
  log?: boolean;
  onSuccess?: (loginURL: string) => any;
  eduvaultAppUrl?: string;
}

/**
 * @summary Adds a link to Eduvault login page to an <a> element. Stores a `clientToken` in localStorage, used to decrypt private key later.
 * @param buttonID must be an `<a>` element
 * @param redirectURL send use back to your app after login. `window.location.href` by default
 * @param eduvaultAppUrl eduvault's login page. set to `eduvault.org/login` by default. This should only be used for eduvault's app suite testing. for a third party app integrating eduvault you should never need to set this.
 */
export const setupLoginButton =
  (eduvault: EduVault) =>
  ({
    buttonID,
    redirectURL,
    eduvaultAppUrl,
    log = false,
    onSuccess,
  }: LoginButtonOptions) => {
    try {
      // console.log({ buttonID, redirectURL });
      const button = buttonID ? document.getElementById(buttonID) : null;
      // console.log({ button });

      if (!button) {
        if (log) console.error('button not found');
        return { error: 'button not found' };
      }
      if (!redirectURL) {
        if (log)
          console.log(
            'redirectURL not found, using default "window.location.origin"'
          );
        redirectURL = window.location.href;
      }

      if (!eduvault.appID) {
        if (log) console.error('appID not found');
        return { error: 'appID not found' };
      }

      localStorage.clear();
      const clientToken = ulid();
      localStorage.setItem('clientToken', clientToken);

      const loginButtonQueries: LoginButtonQueries = {
        appID: eduvault.appID,
        redirectURL,
        clientToken,
      };

      const loginURL =
        (eduvaultAppUrl ?? eduvault.URL_APP) +
        '?' +
        formatQueries(loginButtonQueries);

      button.setAttribute('href', loginURL);

      if (onSuccess) onSuccess(loginURL);
      return { loginURL };
    } catch (error) {
      return { error };
    }
  };
