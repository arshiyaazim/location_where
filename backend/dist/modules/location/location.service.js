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
exports.reportBreach = exports.getGeofences = exports.getHistory = exports.getLiveLocations = exports.logLocation = void 0;
const database_1 = __importDefault(require("../../config/database"));
const redis_1 = __importStar(require("../../config/redis"));
const logLocation = async (employeeId, locationData) => {
    const { latitude, longitude, accuracy, batteryLevel, address } = locationData;
    const log = await database_1.default.locationLog.create({
        data: {
            employeeId,
            latitude,
            longitude,
            accuracy,
            batteryLevel,
            address,
            recordedAt: new Date()
        }
    });
    if ((0, redis_1.isRedisReady)()) {
        const employee = await database_1.default.employee.findUnique({
            where: { id: employeeId },
            select: { fullName: true, employeeCode: true }
        });
        await redis_1.default.hSet('live_locations', employeeId, JSON.stringify({
            latitude,
            longitude,
            battery: batteryLevel,
            name: employee?.fullName,
            employeeCode: employee?.employeeCode,
            lastSeen: new Date(),
            id: employeeId,
            isOnline: true
        }));
    }
    return log;
};
exports.logLocation = logLocation;
const getLiveLocations = async (branchId) => {
    if ((0, redis_1.isRedisReady)()) {
        const allLocations = await redis_1.default.hGetAll('live_locations');
        return Object.values(allLocations).map(loc => JSON.parse(loc));
    }
    const latestLogs = await database_1.default.locationLog.findMany({
        distinct: ['employeeId'],
        orderBy: { recordedAt: 'desc' },
        include: {
            employee: {
                select: {
                    id: true,
                    fullName: true,
                    employeeCode: true,
                    branchId: true,
                    isActive: true
                }
            }
        }
    });
    return latestLogs
        .filter(log => log.employee.isActive && (!branchId || log.employee.branchId === branchId))
        .map(log => ({
        id: log.employeeId,
        name: log.employee.fullName,
        employeeCode: log.employee.employeeCode,
        latitude: log.latitude,
        longitude: log.longitude,
        battery: log.batteryLevel,
        isOnline: true,
        lastSeen: log.recordedAt
    }));
};
exports.getLiveLocations = getLiveLocations;
const getHistory = async (employeeId, from, to, limit) => {
    return database_1.default.locationLog.findMany({
        where: {
            employeeId,
            recordedAt: { gte: from, lte: to }
        },
        orderBy: { recordedAt: 'asc' },
        ...(limit ? { take: limit } : {})
    });
};
exports.getHistory = getHistory;
const getGeofences = async () => {
    return database_1.default.geofence.findMany({
        where: { isActive: true }
    });
};
exports.getGeofences = getGeofences;
const reportBreach = async (employeeId, data) => {
    return database_1.default.geofenceAlert.create({
        data: {
            employeeId,
            geofenceId: data.geofenceId,
            alertType: data.alertType,
            latitude: data.latitude,
            longitude: data.longitude,
            triggeredAt: new Date()
        }
    });
};
exports.reportBreach = reportBreach;
