import EduVault, { WsMessageData } from '../..';
import { UserAuth as PersonAuth, PrivateKey } from '@textile/hub';

export const loginWithChallenge =
  (eduvault: EduVault) =>
  (jwt: string, privateKey: PrivateKey): (() => Promise<PersonAuth>) => {
    // we pass identity into the function returning function to make it
    // available later in the callback
    const makeSendMessage = (ws: WebSocket) => (message: WsMessageData) =>
      ws.send(JSON.stringify(message));

    return () => {
      return new Promise((resolve, reject) => {
        /** Initialize our ws connection */
        // console.log('jwt', jwt);
        // console.log('ws starting');

        const ws = new WebSocket(eduvault.URL_WS_API);
        const sendMessage = makeSendMessage(ws);
        /** Wait for our ws to open successfully */
        ws.onopen = async () => {
          try {
            // console.log('ws open');
            if (!jwt || jwt === '') throw { error: 'no jwt' };
            if (!privateKey) throw { error: 'no privateKey' };

            sendMessage({
              type: 'token-request',
              jwt: jwt,
              pubKey: privateKey.public.toString(),
            });

            ws.onmessage = async (msg) => {
              const data = JSON.parse(msg.data) as WsMessageData;
              // console.log(
              // '=================wss message===================',
              // data
              // );
              switch (data.type) {
                case 'error': {
                  console.log('wss error', data);
                  reject(data.error);
                  break;
                }
                /** The server issued a new challenge */
                case 'challenge-request': {
                  /** Convert the challenge json to a Buffer */
                  const buf = Buffer.from(data.challenge);
                  /** Person our identity to sign the challenge */
                  const signed = await privateKey.sign(buf);
                  /** Send the signed challenge back to the server */
                  sendMessage({
                    type: 'challenge-response',
                    jwt: jwt,
                    signature: Buffer.from(signed).toJSON() as any,
                  });
                  break;
                }
                /** New token generated */
                case 'token-response': {
                  if (data.personAuth) resolve(data.personAuth);
                  break;
                }
              }
            };
          } catch (error) {
            console.log('wss error');
            reject(error);
          }
        };
      });
    };
  };
