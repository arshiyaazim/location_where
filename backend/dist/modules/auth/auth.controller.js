"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.verifyOTP = exports.refresh = exports.initiateMobileLogin = exports.login = void 0;
const authService = __importStar(require("./auth.service"));
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authService.adminLogin(username, password);
        res.json({ success: true, data: result, message: 'Login successful' });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message, code: 'AUTH_FAILED' });
    }
};
exports.login = login;
const initiateMobileLogin = async (req, res) => {
    try {
        const { employeeCode, password, deviceId, fcmToken } = req.body;
        const result = await authService.employeeMobileLogin(employeeCode, password, deviceId, fcmToken);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message, code: 'AUTH_FAILED' });
    }
};
exports.initiateMobileLogin = initiateMobileLogin;
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshAccessToken(refreshToken);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message, code: 'TOKEN_INVALID' });
    }
};
exports.refresh = refresh;
const verifyOTP = async (req, res) => {
    try {
        const { employeeCode, otp, deviceId } = req.body;
        const result = await authService.verifyOTP(employeeCode, otp, deviceId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
};
exports.verifyOTP = verifyOTP;
const logout = async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
};
exports.logout = logout;
