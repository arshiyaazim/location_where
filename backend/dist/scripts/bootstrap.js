"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const adminUsername = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';
const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@12345!';
const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@locationwhere.local';
const employeeCode = process.env.BOOTSTRAP_EMPLOYEE_CODE || 'EMP001';
const employeePassword = process.env.BOOTSTRAP_EMPLOYEE_PASSWORD || 'welcome123';
const employeePhone = process.env.BOOTSTRAP_EMPLOYEE_PHONE || '01700000000';
const employeeName = process.env.BOOTSTRAP_EMPLOYEE_NAME || 'Demo Employee';
const employeeEmail = process.env.BOOTSTRAP_EMPLOYEE_EMAIL || 'employee@locationwhere.local';
async function main() {
    const adminPasswordHash = await bcryptjs_1.default.hash(adminPassword, 10);
    const employeePasswordHash = await bcryptjs_1.default.hash(employeePassword, 10);
    await database_1.default.adminUser.upsert({
        where: { username: adminUsername },
        update: {
            email: adminEmail,
            passwordHash: adminPasswordHash,
            role: 'SUPER_ADMIN',
            isActive: true
        },
        create: {
            username: adminUsername,
            email: adminEmail,
            passwordHash: adminPasswordHash,
            role: 'SUPER_ADMIN',
            isActive: true
        }
    });
    await database_1.default.employee.upsert({
        where: { employeeCode },
        update: {
            fullName: employeeName,
            email: employeeEmail,
            phone: employeePhone,
            password: employeePasswordHash,
            isActive: true,
            registrationStatus: 'UNREGISTERED'
        },
        create: {
            employeeCode,
            fullName: employeeName,
            email: employeeEmail,
            phone: employeePhone,
            password: employeePasswordHash,
            isActive: true,
            registrationStatus: 'UNREGISTERED'
        }
    });
    console.log(`Bootstrap complete. Admin: ${adminUsername}, Employee: ${employeeCode}`);
}
main()
    .catch((error) => {
    console.error('Bootstrap failed:', error);
    process.exitCode = 1;
})
    .finally(async () => {
    await database_1.default.$disconnect();
});
