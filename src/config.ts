export const { NODE_ENV, TEST_ENV } = process.env;
export const dev = NODE_ENV === 'development';
export const unitTest = TEST_ENV === 'unit'; // no SSL
export const e2eTest = TEST_ENV === 'e2e'; // no SSL (SSL through docker)

/** MAKE SURE THESE MATCH eduvault/core/api/src/config.ts */
export const ROUTES = {
  // implemented:
  /** GET */
  PING: '/ping',
  /** GET */
  ENV_CHECK: '/env-check',
  /** GET */
  AUTH_CHECK: '/auth-check',
  /** GET */
  GET_JWT: '/get-jwt',
  /** POST */
  PASSWORD_AUTH: '/auth/password',

  // TODO:
  VERIFY_JWT: '/verify-jwt',
  LOGOUT: '/logout',
  GET_PERSON: '/get-person',

  FACEBOOK_AUTH: '/auth/facebook',
  FACEBOOK_AUTH_CALLBACK: '/auth/facebook/callback',
  GOOGLE_AUTH: '/auth/google',
  GOOGLE_AUTH_CALLBACK: '/auth/google/callback',
  DOTWALLET_AUTH: '/auth/dotwallet',

  APP_AUTH: '/auth/app',
  APP_TOKEN_ISSUE: '/auth/app/issue-token',
  APP_REGISTER: '/app/register',
  APP_UPDATE: '/app/update',
  DEV_VERIFY: '/dev/verify',

  TEXTILE_RENEW: '/renew-textile',
};

export const URL_API = 'https://eduvault.org/api';
export const URL_APP = 'https://eduvault.org/app/login'