import getHandler from './getHandler';
import getJwt from './getJwt';
import passwordLogin from './passwordLogin';
import postHandler from './postHandler';
// might need cookies? https://mswjs.io/docs/recipes/cookies

const ping = getHandler('/ping', 'pong');

export { getHandler, postHandler };

export const handlers = [ping, passwordLogin, getJwt];
