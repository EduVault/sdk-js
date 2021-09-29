import CryptoJS from 'crypto-js';

export function encrypt(content: any, encryptKey: string) {
  // console.log('encrypting', { content, encryptKey });
  if (!content) throw 'no encryption content';

  if (!encryptKey) throw 'no encryption key';

  const encJson = CryptoJS.AES.encrypt(
    JSON.stringify(content),
    encryptKey
  ).toString();
  const encrypted = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(encJson)
  );
  // throw { encrypted });
  return encrypted;

}

export function decrypt(content: string, decryptKey: string) {
  // console.log('decrypting', { content, decryptKey });
  try {
    const decData = CryptoJS.enc.Base64.parse(content).toString(
      CryptoJS.enc.Utf8
    );
    const decryptedBytes = CryptoJS.AES.decrypt(decData, decryptKey).toString(
      CryptoJS.enc.Utf8
    );
    const decrypted = JSON.parse(decryptedBytes);
    // console.log({ decrypted });
    return decrypted;
  } catch (error) {
    console.log('decryption error', error);
    return false;
  }
}

export function hash(content: string) {
  return CryptoJS.SHA256(content).toString();
}
