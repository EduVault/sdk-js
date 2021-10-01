import { decrypt, encrypt } from './encryption';

test('encrypt and decrypt strings', () => {
  const testContent = 'something';
  const testDecryptKey = 'abc123';
  const encrypted = encrypt(testContent, testDecryptKey);
  const decrypted = decrypt(encrypted, testDecryptKey);
  expect(decrypted).toEqual(testContent);
});

test('encrypt and decrypt objects', () => {
  const testContent = { content: 'something' };
  const testDecryptKey = 'abc123';
  const encrypted = encrypt(testContent, testDecryptKey);
  const decrypted = decrypt(encrypted, testDecryptKey);
  expect(decrypted.content).toEqual(testContent.content);
});
