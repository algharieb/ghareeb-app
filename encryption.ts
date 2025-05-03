import * as CryptoJS from "crypto-js";

const SECRET_KEY = "al-ghareeb-app-secret-key";

export const encrypt = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decrypt = (ciphertext: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const comparePasswords = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};
