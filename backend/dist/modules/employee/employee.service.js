"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConsent = exports.handleOnboardingSms = exports.processSmsOnboarding = exports.regeneratePassword = exports.changePassword = exports.deleteEmployee = exports.softDeleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getAllEmployees = exports.listEmployees = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../../config/database"));
const sms_1 = require("../../utils/sms");
const employee_utils_1 = require("./employee.utils");
const APK_DOWNLOAD_URL = process.env.APK_DOWNLOAD_URL || 'https://locationwhere.iamazim.com/downloads/app-debug.apk';
const ADMIN_ONBOARDING_PHONE = process.env.ADMIN_ONBOARDING_PHONE || '01880446111';
const withDeviceName = (deviceInfo) => {
    if (!deviceInfo) {
        return null;
    }
    const deviceName = [deviceInfo.manufacturer, deviceInfo.deviceModel]
        .filter(Boolean)
        .join(' ')
        .trim();
    return {
        ...deviceInfo,
        deviceName: deviceName || deviceInfo.deviceModel || null
    };
};
const sanitizeEmployee = (employee) => {
    const { password, ...safeEmployee } = employee;
    return {
        ...safeEmployee,
        deviceInfo: withDeviceName(employee.deviceInfo)
    };
};
const createEmployeeRecord = async (employeeData) => {
    const fullName = employeeData.fullName.trim();
    const phone = (0, employee_utils_1.normalizePhoneNumber)(employeeData.phone);
    const plainPassword = employeeData.password?.trim() || (0, employee_utils_1.generatePassword)();
    const passwordHash = await bcryptjs_1.default.hash(plainPassword, 10);
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const employeeCode = await (0, employee_utils_1.generateNextEmployeeCode)(database_1.default);
        const email = employeeData.email?.trim() || null;
        try {
            const employee = await database_1.default.employee.create({
                data: {
                    employeeCode,
                    fullName,
                    phone,
                    email,
                    password: passwordHash,
                    registrationStatus: employeeData.registrationStatus || 'UNREGISTERED',
                    isActive: employeeData.isActive ?? true
                },
                include: { deviceInfo: true }
            });
            return {
                employee: sanitizeEmployee(employee),
                generatedPassword: plainPassword
            };
        }
        catch (error) {
            const uniqueTargets = Array.isArray(error?.meta?.target)
                ? error.meta.target
                : [error?.meta?.target].filter(Boolean);
            if (error?.code === 'P2002' && uniqueTargets.includes('employeeCode')) {
                continue;
            }
            if (error?.code === 'P2002' && uniqueTargets.includes('phone')) {
                throw new Error('Employee already exists for this phone number');
            }
            if (error?.code === 'P2002' && uniqueTargets.includes('email')) {
                throw new Error('Employee already exists for this email address');
            }
            throw error;
        }
    }
    throw new Error('Failed to generate a unique employee code');
};
const listEmployees = async (filters = {}) => {
    const { page = 1, limit = 20, search, status, branchId } = filters;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;
    const where = {};
    if (branchId) {
        where.branchId = branchId;
    }
    if (status === 'REGISTERED' || status === 'UNREGISTERED') {
        where.registrationStatus = status;
    }
    else if (status === 'active') {
        where.isActive = true;
    }
    else if (status === 'inactive') {
        where.isActive = false;
    }
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } }
        ];
    }
    const [employees, total] = await Promise.all([
        database_1.default.employee.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: { deviceInfo: true }
        }),
        database_1.default.employee.count({ where })
    ]);
    return {
        data: employees.map(sanitizeEmployee),
        total,
        page: Number(page)
    };
};
exports.listEmployees = listEmployees;
exports.getAllEmployees = exports.listEmployees;
const createEmployee = async (employeeData) => {
    if (!employeeData.fullName?.trim()) {
        throw new Error('Full name is required');
    }
    if (!employeeData.phone?.trim()) {
        throw new Error('Phone is required');
    }
    const result = await createEmployeeRecord({
        fullName: employeeData.fullName,
        phone: employeeData.phone,
        email: employeeData.email,
        password: employeeData.password,
        registrationStatus: 'UNREGISTERED',
        isActive: true
    });
    return {
        employee: result.employee,
        generatedPassword: employeeData.password?.trim() ? undefined : result.generatedPassword
    };
};
exports.createEmployee = createEmployee;
const updateEmployee = async (id, employeeData) => {
    const updateData = {};
    if (employeeData.fullName !== undefined) {
        if (!employeeData.fullName?.trim()) {
            throw new Error('Full name is required');
        }
        updateData.fullName = employeeData.fullName.trim();
    }
    if (employeeData.phone !== undefined) {
        updateData.phone = (0, employee_utils_1.normalizePhoneNumber)(employeeData.phone);
    }
    if (employeeData.email !== undefined) {
        updateData.email = employeeData.email?.trim() || null;
    }
    const employee = await database_1.default.employee.update({
        where: { id },
        data: updateData,
        include: { deviceInfo: true }
    });
    return sanitizeEmployee(employee);
};
exports.updateEmployee = updateEmployee;
const softDeleteEmployee = async (id) => {
    const employee = await database_1.default.employee.update({
        where: { id },
        data: { isActive: false },
        include: { deviceInfo: true }
    });
    return sanitizeEmployee(employee);
};
exports.softDeleteEmployee = softDeleteEmployee;
exports.deleteEmployee = exports.softDeleteEmployee;
const changePassword = async (id, newPassword) => {
    if (!newPassword?.trim() || newPassword.trim().length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    await database_1.default.employee.update({
        where: { id },
        data: {
            password: await bcryptjs_1.default.hash(newPassword.trim(), 10)
        }
    });
    return { id };
};
exports.changePassword = changePassword;
const regeneratePassword = async (id) => {
    const generatedPassword = (0, employee_utils_1.generatePassword)();
    const employee = await database_1.default.employee.update({
        where: { id },
        data: {
            password: await bcryptjs_1.default.hash(generatedPassword, 10)
        },
        include: { deviceInfo: true }
    });
    return {
        employee: sanitizeEmployee(employee),
        generatedPassword
    };
};
exports.regeneratePassword = regeneratePassword;
const processSmsOnboarding = async (payload) => {
    const sender = (0, employee_utils_1.normalizePhoneNumber)(payload.sender);
    const recipient = (0, employee_utils_1.normalizePhoneNumber)(payload.recipient);
    const expectedRecipient = (0, employee_utils_1.normalizePhoneNumber)(ADMIN_ONBOARDING_PHONE);
    if (recipient !== expectedRecipient) {
        return { status: 'ignored' };
    }
    try {
        const { phone, fullName } = (0, employee_utils_1.parseOnboardingSms)(payload.body);
        const existingEmployee = await database_1.default.employee.findUnique({
            where: { phone },
            select: { employeeCode: true }
        });
        if (existingEmployee) {
            return {
                status: 'duplicate',
                employeeCode: existingEmployee.employeeCode
            };
        }
        const result = await createEmployeeRecord({
            fullName,
            phone,
            registrationStatus: 'UNREGISTERED',
            isActive: true
        });
        await (0, sms_1.sendSMS)(sender, `Welcome ${fullName}! ID: ${result.employee.employeeCode} Pass: ${result.generatedPassword} APK: ${APK_DOWNLOAD_URL}`);
        return {
            status: 'created',
            employeeCode: result.employee.employeeCode
        };
    }
    catch (error) {
        if (error.message === 'SMS body must match: ID: <mobile_number> <employee_name>') {
            return { status: 'invalid_format' };
        }
        throw error;
    }
};
exports.processSmsOnboarding = processSmsOnboarding;
const handleOnboardingSms = async (payload) => (0, exports.processSmsOnboarding)({
    sender: payload.sender || payload.from || '',
    recipient: payload.recipient || payload.to || '',
    body: payload.body || payload.message || payload.text || ''
});
exports.handleOnboardingSms = handleOnboardingSms;
const updateConsent = async (id, consentData) => {
    return database_1.default.employee.update({
        where: { id },
        data: consentData
    });
};
exports.updateConsent = updateConsent;
