"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getAlerts = void 0;
const database_1 = __importDefault(require("../../config/database"));
const getAlerts = async (filters) => {
    const { severity, isRead, page = 1 } = filters;
    const skip = (Number(page) - 1) * 20;
    const where = {};
    if (severity)
        where.severity = severity;
    if (isRead !== undefined)
        where.isRead = isRead === 'true';
    return database_1.default.alert.findMany({
        where,
        skip,
        take: 20,
        include: { employee: true },
        orderBy: { createdAt: 'desc' }
    });
};
exports.getAlerts = getAlerts;
const markAsRead = async (id, adminId) => {
    return database_1.default.alert.update({
        where: { id },
        data: { isRead: true, readById: adminId }
    });
};
exports.markAsRead = markAsRead;
