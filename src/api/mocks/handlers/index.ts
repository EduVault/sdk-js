import appLogin from './appLogin';
import checkAuth from './checkAuth';
import getHandler from './getHandler';
import getJwt from './getJwt';
import passwordLogin from './passwordLogin';

// might need cookies? https://mswjs.io/docs/recipes/cookies

const ping = getHandler('/ping', 'pong');

export const handlers = [ping, passwordLogin, appLogin, getJwt, checkAuth];
