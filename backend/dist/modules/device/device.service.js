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
exports.sendRemoteLock = exports.sendCommand = exports.markExecuted = exports.getPendingCommands = exports.registerDevice = void 0;
const database_1 = __importDefault(require("../../config/database"));
const firebase_1 = __importStar(require("../../config/firebase"));
const registerDevice = async (employeeId, deviceData) => {
    const [device] = await database_1.default.$transaction([
        database_1.default.deviceInfo.upsert({
            where: { employeeId },
            update: {
                ...deviceData,
                lastSeen: new Date(),
                updatedAt: new Date()
            },
            create: {
                employeeId,
                ...deviceData,
                lastSeen: new Date()
            }
        }),
        database_1.default.employee.update({
            where: { id: employeeId },
            data: {
                registrationStatus: 'REGISTERED',
                ...(deviceData.fcmToken ? { fcmToken: deviceData.fcmToken } : {})
            }
        })
    ]);
    return device;
};
exports.registerDevice = registerDevice;
const getPendingCommands = async (employeeId) => {
    return database_1.default.remoteCommand.findMany({
        where: {
            employeeId,
            status: { in: ['PENDING', 'SENT'] }
        }
    });
};
exports.getPendingCommands = getPendingCommands;
const markExecuted = async (commandId) => {
    return database_1.default.remoteCommand.update({
        where: { id: commandId },
        data: {
            status: 'EXECUTED',
            executedAt: new Date()
        }
    });
};
exports.markExecuted = markExecuted;
const sendCommand = async (employeeId, adminId, type, payload) => {
    const employee = await database_1.default.employee.findUnique({
        where: { id: employeeId },
        include: { deviceInfo: true }
    });
    const fcmToken = employee?.deviceInfo?.fcmToken || employee?.fcmToken;
    if (!employee || !fcmToken) {
        throw new Error('Employee or device FCM token not found');
    }
    if (!(0, firebase_1.isFirebaseAdminInitialized)()) {
        throw new Error('Firebase Admin SDK is not initialized');
    }
    const command = await database_1.default.remoteCommand.create({
        data: {
            employeeId,
            adminId,
            commandType: type,
            commandPayload: payload,
            status: 'SENT',
            sentAt: new Date()
        }
    });
    await firebase_1.default.messaging().send({
        token: fcmToken,
        data: {
            type: 'REMOTE_COMMAND',
            command: type,
            commandId: command.id,
            payload: payload ? JSON.stringify(payload) : ''
        },
        android: { priority: 'high' }
    });
    return command;
};
exports.sendCommand = sendCommand;
const sendRemoteLock = async (employeeId, adminId) => {
    return (0, exports.sendCommand)(employeeId, adminId, 'LOCK');
};
exports.sendRemoteLock = sendRemoteLock;
