"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmployeeReport = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateEmployeeReport = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default();
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));
        doc.fontSize(20).text('Employee Activity Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Employee: ${data.fullName} (${data.employeeCode})`);
        doc.text(`Period: ${data.period}`);
        doc.moveDown();
        doc.text('Summary of Activities:', { underline: true });
        doc.text(`Total Calls: ${data.totalCalls}`);
        doc.text(`Geofence Breaches: ${data.geofenceBreaches}`);
        doc.moveDown();
        // Add more details from data...
        doc.end();
    });
};
exports.generateEmployeeReport = generateEmployeeReport;
