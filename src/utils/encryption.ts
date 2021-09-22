import CryptoJS from 'crypto-js';

export function encrypt(content: any, encryptKey: string) {
  // console.log('encrypting', { content, encryptKey });
  if (!content) {
    console.log('no encryption content');
    return null;
  }
  if (!encryptKey) {
    console.log('no encryption key');
    return null;
  }
  try {
    const encJson = CryptoJS.AES.encrypt(
      JSON.stringify(content),
      encryptKey
    ).toString();
    const encrypted = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(encJson)
    );
    // console.log({ encrypted });
    return encrypted;
  } catch (error) {
    console.log('error encrypting', error);
    return null;
  }
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
    return JSON.parse(decryptedBytes);
  } catch (error) {
    console.log('decryption error', error);
    return false;
  }
}

export function hash(content: string) {
  return CryptoJS.SHA256(content).toString();
}
