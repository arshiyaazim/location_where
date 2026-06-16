"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyChecksum = exports.generateChecksum = exports.decryptAES256 = exports.encryptAES256 = void 0;
const crypto_1 = __importDefault(require("crypto"));
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY || '01234567890123456789012345678901');
const iv = Buffer.from(process.env.ENCRYPTION_IV || '0123456789012345');
const encryptAES256 = (text) => {
    const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};
exports.encryptAES256 = encryptAES256;
const decryptAES256 = (encrypted) => {
    const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptAES256 = decryptAES256;
const generateChecksum = (data) => {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
exports.generateChecksum = generateChecksum;
const verifyChecksum = (data, checksum) => {
    return (0, exports.generateChecksum)(data) === checksum;
};
exports.verifyChecksum = verifyChecksum;
