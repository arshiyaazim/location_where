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
exports.breachGeofence = exports.listGeofences = exports.getEmployeeHistory = exports.getLive = exports.updateLocation = void 0;
const locationService = __importStar(require("./location.service"));
const updateLocation = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const result = await locationService.logLocation(employeeId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateLocation = updateLocation;
const getLive = async (req, res) => {
    try {
        const branchId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.branchId;
        const employees = await locationService.getLiveLocations(branchId);
        res.json({ success: true, data: { employees } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getLive = getLive;
const getEmployeeHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { from, to, limit } = req.query;
        const parsedLimit = typeof limit === 'string' ? Number.parseInt(limit, 10) : undefined;
        if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
            throw new Error('Invalid limit parameter');
        }
        const now = new Date();
        const defaultFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const fromDate = typeof from === 'string' && from.trim() ? new Date(from) : defaultFrom;
        const toDate = typeof to === 'string' && to.trim() ? new Date(to) : now;
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            throw new Error('Invalid date range');
        }
        const routes = await locationService.getHistory(employeeId, fromDate, toDate, parsedLimit);
        res.json({ success: true, data: { routes } });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.getEmployeeHistory = getEmployeeHistory;
const listGeofences = async (req, res) => {
    try {
        const geofences = await locationService.getGeofences();
        res.json({ success: true, data: geofences });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.listGeofences = listGeofences;
const breachGeofence = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const result = await locationService.reportBreach(employeeId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.breachGeofence = breachGeofence;
