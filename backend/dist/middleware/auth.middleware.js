"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authEmployee = exports.authAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (secret) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            req.user = decoded;
            next();
        }
        catch (error) {
            return res.status(401).json({ success: false, error: 'Token expired or invalid', code: 'TOKEN_INVALID' });
        }
    };
};
exports.authenticate = authenticate;
exports.authAdmin = (0, exports.authenticate)(process.env.JWT_ACCESS_SECRET || 'access_secret');
exports.authEmployee = (0, exports.authenticate)(process.env.JWT_ACCESS_SECRET || 'access_secret'); // Can use different secret if needed
