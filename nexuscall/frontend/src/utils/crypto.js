import CryptoJS from 'crypto-js';

const SECRET_PHRASE = 'NexusSimulationPassphrase';

export const encryptMessage = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_PHRASE).toString();
};

export const decryptMessage = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_PHRASE);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return '[Decryption Failure]';
  }
};