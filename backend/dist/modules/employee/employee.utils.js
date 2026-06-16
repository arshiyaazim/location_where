"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOnboardingSms = exports.generateNextEmployeeCode = exports.generatePassword = exports.buildPlaceholderEmail = exports.maskPhoneNumber = exports.normalizeSmsNumber = exports.normalizePhoneNumber = void 0;
const crypto_1 = __importDefault(require("crypto"));
const EMPLOYEE_CODE_PATTERN = /^EMP(\d+)$/i;
const normalizePhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('880') && digits.length === 13) {
        return `0${digits.slice(3)}`;
    }
    if (digits.startsWith('01') && digits.length === 11) {
        return digits;
    }
    throw new Error('Phone number must be a valid Bangladesh mobile number');
};
exports.normalizePhoneNumber = normalizePhoneNumber;
const normalizeSmsNumber = (value) => {
    const localNumber = (0, exports.normalizePhoneNumber)(value);
    return `880${localNumber.slice(1)}`;
};
exports.normalizeSmsNumber = normalizeSmsNumber;
const maskPhoneNumber = (value) => {
    const localNumber = (0, exports.normalizePhoneNumber)(value);
    return `${localNumber.slice(0, 3)}******${localNumber.slice(-2)}`;
};
exports.maskPhoneNumber = maskPhoneNumber;
const buildPlaceholderEmail = (employeeCode) => `${employeeCode.toLowerCase()}@onboarding.locationwhere.local`;
exports.buildPlaceholderEmail = buildPlaceholderEmail;
const generatePassword = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const bytes = crypto_1.default.randomBytes(10);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};
exports.generatePassword = generatePassword;
const getHighestEmployeeSequence = async (prisma) => {
    const employees = await prisma.employee.findMany({
        select: { employeeCode: true }
    });
    return employees.reduce((highest, employee) => {
        const match = employee.employeeCode.match(EMPLOYEE_CODE_PATTERN);
        if (!match)
            return highest;
        return Math.max(highest, Number(match[1]));
    }, 0);
};
const generateNextEmployeeCode = async (prisma) => {
    const nextSequence = (await getHighestEmployeeSequence(prisma)) + 1;
    return `EMP${String(nextSequence).padStart(3, '0')}`;
};
exports.generateNextEmployeeCode = generateNextEmployeeCode;
const parseOnboardingSms = (rawMessage) => {
    const match = rawMessage.trim().match(/^ID:\s*(\+?[\d\s-]+)\s+(.+)$/i);
    if (!match) {
        throw new Error('SMS body must match: ID: <mobile_number> <employee_name>');
    }
    return {
        phone: (0, exports.normalizePhoneNumber)(match[1]),
        fullName: match[2].trim()
    };
};
exports.parseOnboardingSms = parseOnboardingSms;
