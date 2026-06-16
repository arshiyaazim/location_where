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
exports.resolveAlert = exports.getAlerts = exports.createAlert = void 0;
const simService = __importStar(require("./sim.service"));
const database_1 = __importDefault(require("../../config/database"));
const createAlert = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const result = await simService.createSimAlert(employeeId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createAlert = createAlert;
const getAlerts = async (req, res) => {
    try {
        const { status, page = 1 } = req.query;
        const skip = (Number(page) - 1) * 20;
        const alerts = await database_1.default.simChangeLog.findMany({
            where: status ? { status: status } : {},
            skip,
            take: 20,
            include: { employee: true },
            orderBy: { detectedAt: 'desc' }
        });
        res.json({ success: true, data: alerts });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getAlerts = getAlerts;
const resolveAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;
        const result = await database_1.default.simChangeLog.update({
            where: { id },
            data: {
                status,
                resolvedAt: new Date(),
                resolvedById: req.user.id
            }
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.resolveAlert = resolveAlert;
