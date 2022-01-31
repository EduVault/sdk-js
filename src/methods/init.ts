import EduVault from '../index';
import { initOptions } from '../types';

export const init = (eduvault: EduVault, options: initOptions) => {
  eduvault.appID = options.appID;

  eduvault.log = options.log;
  if (options.log) console.log({ options });

  if (options.URL_API) eduvault.URL_API = options.URL_API;
  if (options.URL_APP) eduvault.URL_APP = options.URL_APP;
  if (options.URL_WS_API) eduvault.URL_WS_API = options.URL_WS_API;
  // if (options.devMode) eduvault.devMode = options.devMode;
};
