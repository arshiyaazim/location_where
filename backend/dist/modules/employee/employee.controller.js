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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitConsent = exports.smsOnboardingHandler = exports.regeneratePassword = exports.changePassword = exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployees = void 0;
const employeeService = __importStar(require("./employee.service"));
const logger_1 = __importDefault(require("../../utils/logger"));
const employee_utils_1 = require("./employee.utils");
const safeMaskPhone = (value) => {
    try {
        return value ? (0, employee_utils_1.maskPhoneNumber)(value) : 'unknown';
    }
    catch {
        return 'unknown';
    }
};
const safeNormalizePhone = (value) => {
    try {
        return value ? (0, employee_utils_1.normalizePhoneNumber)(value) : 'unknown';
    }
    catch {
        return 'unknown';
    }
};
const getEmployees = async (req, res) => {
    try {
        const result = await employeeService.listEmployees(req.query);
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getEmployees = getEmployees;
const createEmployee = async (req, res) => {
    try {
        const result = await employeeService.createEmployee(req.body);
        res.status(201).json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        const result = await employeeService.updateEmployee(req.params.id, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res) => {
    try {
        const result = await employeeService.softDeleteEmployee(req.params.id);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.deleteEmployee = deleteEmployee;
const changePassword = async (req, res) => {
    try {
        const result = await employeeService.changePassword(req.params.id, req.body.password);
        res.json({ success: true, data: result, message: 'Password updated successfully' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.changePassword = changePassword;
const regeneratePassword = async (req, res) => {
    try {
        const result = await employeeService.regeneratePassword(req.params.id);
        res.json({ success: true, data: result, message: 'Password regenerated successfully' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.regeneratePassword = regeneratePassword;
const smsOnboardingHandler = async (req, res) => {
    const expectedSecret = process.env.SMS_GATEWAY_SECRET?.trim();
    if (!expectedSecret) {
        logger_1.default.error('SMS_GATEWAY_SECRET is not configured');
        return res.status(500).json({ success: false, error: 'Gateway not configured' });
    }
    const receivedSecret = req.headers['x-gateway-secret'];
    if (!receivedSecret || receivedSecret !== expectedSecret) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const payload = {
        sender: req.body.sender || req.body.from || req.body.msisdn || '',
        recipient: req.body.recipient || req.body.to || req.body.destination || '',
        body: req.body.body || req.body.message || req.body.text || req.body.sms || ''
    };
    try {
        const result = await employeeService.processSmsOnboarding(payload);
        logger_1.default.info('sms_onboarding_processed', {
            event: 'sms_onboarding',
            sender_masked: safeMaskPhone(payload.sender),
            recipient: safeNormalizePhone(payload.recipient),
            outcome: result.status,
            employeeCode: 'employeeCode' in result ? result.employeeCode : undefined
        });
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        logger_1.default.error('sms_onboarding_failed', {
            event: 'sms_onboarding',
            sender_masked: safeMaskPhone(payload.sender),
            recipient: safeNormalizePhone(payload.recipient),
            outcome: 'error',
            error: error.message
        });
        res.status(200).json({ success: false, data: { status: 'error' }, error: error.message });
    }
};
exports.smsOnboardingHandler = smsOnboardingHandler;
const submitConsent = async (req, res) => {
    try {
        const id = req.params.id || req.user.id;
        const result = await employeeService.updateConsent(id, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.submitConsent = submitConsent;
