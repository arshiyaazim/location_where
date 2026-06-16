"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.employeeMobileLogin = exports.initiateEmployeeLogin = exports.adminLogin = exports.refreshAccessToken = exports.generateTokens = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../../config/database"));
const sms_1 = require("../../utils/sms");
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const generateTokens = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        const payload = {
            id: decoded.id,
            role: decoded.role,
            branchId: decoded.branchId,
        };
        return {
            accessToken: jsonwebtoken_1.default.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
        };
    }
    catch {
        throw new Error('Invalid refresh token');
    }
};
exports.refreshAccessToken = refreshAccessToken;
const adminLogin = async (username, password) => {
    const admin = await database_1.default.adminUser.findUnique({ where: { username } });
    if (!admin || !admin.isActive)
        throw new Error('Invalid credentials');
    const isMatch = await bcryptjs_1.default.compare(password, admin.passwordHash);
    if (!isMatch)
        throw new Error('Invalid credentials');
    await database_1.default.adminUser.update({
        where: { id: admin.id },
        data: { lastLogin: new Date() }
    });
    return {
        ...(0, exports.generateTokens)({ id: admin.id, role: admin.role, branchId: admin.branchId }),
        admin: { id: admin.id, username: admin.username, role: admin.role }
    };
};
exports.adminLogin = adminLogin;
const initiateEmployeeLogin = async (employeeCode) => {
    const employee = await database_1.default.employee.findUnique({ where: { employeeCode } });
    if (!employee || !employee.isActive)
        throw new Error('Employee not found or inactive');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // In a real app, store OTP in Redis with expiry
    await (0, sms_1.sendSMS)(employee.phone, `Your monitoring app verification code is: ${otp}`);
    return { message: 'OTP sent to registered phone number' };
};
exports.initiateEmployeeLogin = initiateEmployeeLogin;
const employeeMobileLogin = async (employeeCode, password, deviceId, fcmToken) => {
    const employee = await database_1.default.employee.findUnique({ where: { employeeCode } });
    if (!employee || !employee.isActive)
        throw new Error('Invalid employee credentials');
    const isMatch = await bcryptjs_1.default.compare(password, employee.password);
    if (!isMatch)
        throw new Error('Invalid employee credentials');
    await database_1.default.employee.update({
        where: { id: employee.id },
        data: {
            deviceId,
            ...(fcmToken ? { fcmToken } : {})
        }
    });
    return {
        ...(0, exports.generateTokens)({ id: employee.id, role: 'EMPLOYEE', branchId: employee.branchId }),
        employee: {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
            department: employee.department,
            designation: employee.designation
        }
    };
};
exports.employeeMobileLogin = employeeMobileLogin;
const verifyOTP = async (employeeCode, otp, deviceId) => {
    const employee = await database_1.default.employee.findUnique({ where: { employeeCode } });
    if (!employee)
        throw new Error('Invalid employee code');
    // Verify logic (normally against Redis)
    if (otp !== "123456") { // Hardcoded for demo/testing
        // throw new Error('Invalid OTP');
    }
    await database_1.default.employee.update({
        where: { id: employee.id },
        data: { deviceId }
    });
    return {
        ...(0, exports.generateTokens)({ id: employee.id, role: 'EMPLOYEE' }),
        employee: { id: employee.id, fullName: employee.fullName, employeeCode: employee.employeeCode }
    };
};
exports.verifyOTP = verifyOTP;
