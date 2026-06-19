"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConsent = exports.handleOnboardingSms = exports.processSmsOnboarding = exports.regeneratePassword = exports.changePassword = exports.deleteEmployee = exports.softDeleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getAllEmployees = exports.listEmployees = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = __importDefault(require("../../utils/logger"));
const employee_utils_1 = require("./employee.utils");
const APK_DOWNLOAD_URL = process.env.APK_DOWNLOAD_URL || 'https://locationwhere.iamazim.com/downloads/app-debug.apk';
const ADMIN_ONBOARDING_PHONE = process.env.ADMIN_ONBOARDING_PHONE || '01958122300';
const FAZLE_CORE_SYNC_ENABLED = (process.env.FAZLE_CORE_SYNC_ENABLED || 'true').toLowerCase() === 'true';
const FAZLE_CORE_TABLE = process.env.FAZLE_CORE_EMPLOYEE_TABLE || 'wbom_employees';
let fazleColumnsCache = null;
const getFazleCoreColumns = async () => {
    if (fazleColumnsCache) {
        return fazleColumnsCache;
    }
    const columns = await database_1.default.$queryRaw `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${FAZLE_CORE_TABLE}
  `;
    fazleColumnsCache = new Set(columns.map((row) => row.column_name));
    return fazleColumnsCache;
};
const syncEmployeeToFazleCore = async (employee) => {
    if (!FAZLE_CORE_SYNC_ENABLED) {
        return;
    }
    try {
        const columns = await getFazleCoreColumns();
        if (!columns.size) {
            logger_1.default.warn('fazle_core_sync_skipped_no_table', { table: FAZLE_CORE_TABLE });
            return;
        }
        if (!columns.has('employee_mobile') || !columns.has('employee_name')) {
            logger_1.default.warn('fazle_core_sync_skipped_missing_columns', {
                table: FAZLE_CORE_TABLE,
                employee_mobile: columns.has('employee_mobile'),
                employee_name: columns.has('employee_name')
            });
            return;
        }
        const existing = await database_1.default.$queryRawUnsafe(`SELECT employee_mobile FROM ${FAZLE_CORE_TABLE} WHERE employee_mobile = $1 LIMIT 1`, employee.phone);
        if (existing.length > 0) {
            const updateSql = columns.has('updated_at')
                ? `UPDATE ${FAZLE_CORE_TABLE} SET employee_name = $1, updated_at = NOW() WHERE employee_mobile = $2`
                : `UPDATE ${FAZLE_CORE_TABLE} SET employee_name = $1 WHERE employee_mobile = $2`;
            await database_1.default.$executeRawUnsafe(updateSql, employee.fullName, employee.phone);
            return;
        }
        const insertColumns = [];
        const insertValues = [];
        const args = [];
        const addArg = (value) => {
            args.push(value);
            return `$${args.length}`;
        };
        insertColumns.push('employee_mobile');
        insertValues.push(addArg(employee.phone));
        insertColumns.push('employee_name');
        insertValues.push(addArg(employee.fullName));
        if (columns.has('status')) {
            insertColumns.push('status');
            insertValues.push(addArg('ACTIVE'));
        }
        if (columns.has('joining_date')) {
            insertColumns.push('joining_date');
            insertValues.push('CURRENT_DATE');
        }
        if (columns.has('created_at')) {
            insertColumns.push('created_at');
            insertValues.push('NOW()');
        }
        if (columns.has('updated_at')) {
            insertColumns.push('updated_at');
            insertValues.push('NOW()');
        }
        const insertSql = `INSERT INTO ${FAZLE_CORE_TABLE} (${insertColumns.join(', ')}) VALUES (${insertValues.join(', ')})`;
        await database_1.default.$executeRawUnsafe(insertSql, ...args);
    }
    catch (error) {
        logger_1.default.warn('fazle_core_sync_failed', {
            table: FAZLE_CORE_TABLE,
            phone: employee.phone,
            error: error?.message || String(error)
        });
    }
};
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
            await syncEmployeeToFazleCore({
                fullName: employee.fullName,
                phone: employee.phone
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
    const replyTo = sender;
    if (recipient !== expectedRecipient) {
        return {
            status: 'ignored',
            replyTo,
            replyMessage: 'Onboarding SMS was not addressed to the configured gateway number.'
        };
    }
    try {
        const { phone, fullName } = (0, employee_utils_1.parseOnboardingSms)(payload.body);
        if (sender !== phone) {
            return {
                status: 'sender_mismatch',
                replyTo,
                replyMessage: 'The mobile number in the ID SMS must match the sender number.'
            };
        }
        const existingEmployee = await database_1.default.employee.findUnique({
            where: { phone },
            select: { employeeCode: true }
        });
        if (existingEmployee) {
            return {
                status: 'duplicate',
                employeeCode: existingEmployee.employeeCode,
                replyTo,
                replyMessage: `This number is already registered as ${existingEmployee.employeeCode}.`
            };
        }
        const result = await createEmployeeRecord({
            fullName,
            phone,
            registrationStatus: 'UNREGISTERED',
            isActive: true
        });
        return {
            status: 'created',
            employeeCode: result.employee.employeeCode,
            replyTo,
            replyMessage: `Welcome ${fullName}!\nID: ${result.employee.employeeCode}\nPass: ${result.generatedPassword}\nAPK: ${APK_DOWNLOAD_URL}`
        };
    }
    catch (error) {
        if (error.message === 'SMS body must include ID and a mobile number') {
            return {
                status: 'invalid_format',
                replyTo,
                replyMessage: 'Invalid format. Please send: ID: <mobile_number> <employee_name>'
            };
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
