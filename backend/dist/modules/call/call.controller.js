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
exports.getRecording = exports.getCalls = exports.uploadRecording = exports.logCall = void 0;
const callService = __importStar(require("./call.service"));
const database_1 = __importDefault(require("../../config/database"));
const logCall = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const result = await callService.logCall(employeeId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.logCall = logCall;
const uploadRecording = async (req, res) => {
    try {
        const { callLogId, checksum } = req.body;
        if (!req.file)
            throw new Error('No file uploaded');
        if (!checksum)
            throw new Error('Recording checksum is required');
        const result = await callService.uploadRecording(callLogId, req.file, checksum);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.uploadRecording = uploadRecording;
const getCalls = async (req, res) => {
    try {
        const { employeeId, from, to, page = 1 } = req.query;
        const skip = (Number(page) - 1) * 20;
        const where = {};
        if (employeeId)
            where.employeeId = employeeId;
        if (from && to) {
            where.createdAt = { gte: new Date(from), lte: new Date(to) };
        }
        const calls = await database_1.default.callLog.findMany({
            where,
            skip,
            take: 20,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: calls });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getCalls = getCalls;
const getRecording = async (req, res) => {
    try {
        const { id } = req.params;
        const url = await callService.getRecordingUrl(id);
        res.json({ success: true, data: { url } });
    }
    catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
};
exports.getRecording = getRecording;
