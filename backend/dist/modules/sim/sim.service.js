"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSimAlert = void 0;
const database_1 = __importDefault(require("../../config/database"));
const createSimAlert = async (employeeId, alertData) => {
    const { previousSim, newSim, previousIMSI, newIMSI, deviceInfo } = alertData;
    const simLog = await database_1.default.simChangeLog.create({
        data: {
            employeeId,
            deviceId: deviceInfo.deviceId || 'unknown',
            previousSimNumber: previousSim,
            newSimNumber: newSim,
            previousIMSI,
            newIMSI,
            deviceModel: deviceInfo.deviceModel,
            androidVersion: deviceInfo.androidVersion,
            status: 'PENDING'
        }
    });
    // Also create a high severity alert
    await database_1.default.alert.create({
        data: {
            employeeId,
            alertType: 'SIM_CHANGE',
            severity: 'CRITICAL',
            message: `SIM change detected! New SIM: ${newSim}`
        }
    });
    return simLog;
};
exports.createSimAlert = createSimAlert;
