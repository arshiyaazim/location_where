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
exports.lockDevice = exports.postCommand = exports.executed = exports.pendingCommands = exports.register = void 0;
const deviceService = __importStar(require("./device.service"));
const register = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const result = await deviceService.registerDevice(employeeId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.register = register;
const pendingCommands = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const commands = await deviceService.getPendingCommands(employeeId);
        res.json({ success: true, data: commands });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.pendingCommands = pendingCommands;
const executed = async (req, res) => {
    try {
        const { commandId } = req.body;
        const result = await deviceService.markExecuted(commandId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.executed = executed;
const postCommand = async (req, res) => {
    try {
        const { employeeId, commandType, payload } = req.body;
        const adminId = req.user.id;
        const result = await deviceService.sendCommand(employeeId, adminId, commandType, payload);
        res.json({ success: true, data: result, message: `Command ${commandType} sent` });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.postCommand = postCommand;
const lockDevice = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const adminId = req.user.id;
        const result = await deviceService.sendRemoteLock(employeeId, adminId);
        res.json({ success: true, data: result, message: 'Lock command sent' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.lockDevice = lockDevice;
