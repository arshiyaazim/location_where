"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfReport = exports.getDailyReport = void 0;
const database_1 = __importDefault(require("../../config/database"));
const pdf_generator_1 = require("../../utils/pdf.generator");
const getDailyReport = async (date, employeeId) => {
    const targetDate = new Date(date);
    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));
    const where = { recordedAt: { gte: start, lte: end } };
    if (employeeId)
        where.employeeId = employeeId;
    const locations = await database_1.default.locationLog.findMany({ where, orderBy: { recordedAt: 'asc' } });
    const calls = await database_1.default.callLog.findMany({
        where: { startedAt: { gte: start, lte: end }, ...(employeeId && { employeeId }) }
    });
    return { locations, calls, date };
};
exports.getDailyReport = getDailyReport;
const generatePdfReport = async (filters) => {
    const { employeeId, from, to } = filters;
    const employee = await database_1.default.employee.findUnique({ where: { id: employeeId } });
    if (!employee)
        throw new Error('Employee not found');
    const calls = await database_1.default.callLog.count({
        where: { employeeId, startedAt: { gte: new Date(from), lte: new Date(to) } }
    });
    const data = {
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        period: `${from} to ${to}`,
        totalCalls: calls,
        geofenceBreaches: 0 // Placeholder
    };
    return (0, pdf_generator_1.generateEmployeeReport)(data);
};
exports.generatePdfReport = generatePdfReport;
