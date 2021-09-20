import { EduVault } from '../';
export interface LoginButtonOptions {
  buttonID: string;
  redirectURL?: string;
  appID?: string;
  log?: boolean;
  onSuccess?: (loginURL: string) => any;
}

/** Adds a link to Eduvault login page to an <a> element
 * @param buttonID must be an <a> element
 */
export const setupLoginButton =
  (self: EduVault) =>
  ({
    buttonID,
    redirectURL,
    appID,
    log = false,
    onSuccess,
  }: LoginButtonOptions) => {
    // console.log({ buttonID, redirectURL });
    const button = buttonID ? document.getElementById(buttonID) : null;
    // console.log({ button });

    if (!button) {
      if (log) console.log('button not found');
      return { error: 'button not found' };
    }
    if (!redirectURL) {
      if (log)
        console.log(
          'redirectURL not found, using default "window.location.origin"'
        );
    }
    if (!appID) {
      if (log) console.log('appID not found');
      return { error: 'appID not found' };
    }
    try {
      if (!redirectURL) redirectURL = window.location.origin;
      const loginURL = `${self.URL_APP}?app_id=${appID}&redirect_url=${redirectURL}`;
      button.setAttribute('href', loginURL);
      if (onSuccess) onSuccess(loginURL);
      return { loginURL };
    } catch (error) {
      return { error };
    }
  };
