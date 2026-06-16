import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { sendSMS } from '../../utils/sms';
import {
  generateNextEmployeeCode,
  generatePassword,
  normalizePhoneNumber,
  parseOnboardingSms
} from './employee.utils';

const APK_DOWNLOAD_URL =
  process.env.APK_DOWNLOAD_URL || 'https://locationwhere.iamazim.com/downloads/app-debug.apk';
const ADMIN_ONBOARDING_PHONE =
  process.env.ADMIN_ONBOARDING_PHONE || '01880446111';

const withDeviceName = (deviceInfo: any) => {
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

const sanitizeEmployee = (employee: any) => {
  const { password, ...safeEmployee } = employee;
  return {
    ...safeEmployee,
    deviceInfo: withDeviceName(employee.deviceInfo)
  };
};

const createEmployeeRecord = async (employeeData: {
  fullName: string;
  phone: string;
  email?: string | null;
  password?: string;
  registrationStatus?: 'UNREGISTERED' | 'REGISTERED';
  isActive?: boolean;
}) => {
  const fullName = employeeData.fullName.trim();
  const phone = normalizePhoneNumber(employeeData.phone);
  const plainPassword = employeeData.password?.trim() || generatePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const employeeCode = await generateNextEmployeeCode(prisma);
    const email = employeeData.email?.trim() || null;

    try {
      const employee = await prisma.employee.create({
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
    } catch (error: any) {
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

export const listEmployees = async (filters: any = {}) => {
  const { page = 1, limit = 20, search, status, branchId } = filters;
  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const where: any = {};

  if (branchId) {
    where.branchId = branchId;
  }

  if (status === 'REGISTERED' || status === 'UNREGISTERED') {
    where.registrationStatus = status;
  } else if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
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
    prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { deviceInfo: true }
    }),
    prisma.employee.count({ where })
  ]);

  return {
    data: employees.map(sanitizeEmployee),
    total,
    page: Number(page)
  };
};

export const getAllEmployees = listEmployees;

export const createEmployee = async (employeeData: any) => {
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

export const updateEmployee = async (id: string, employeeData: any) => {
  const updateData: Record<string, any> = {};

  if (employeeData.fullName !== undefined) {
    if (!employeeData.fullName?.trim()) {
      throw new Error('Full name is required');
    }
    updateData.fullName = employeeData.fullName.trim();
  }

  if (employeeData.phone !== undefined) {
    updateData.phone = normalizePhoneNumber(employeeData.phone);
  }

  if (employeeData.email !== undefined) {
    updateData.email = employeeData.email?.trim() || null;
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: updateData,
    include: { deviceInfo: true }
  });

  return sanitizeEmployee(employee);
};

export const softDeleteEmployee = async (id: string) => {
  const employee = await prisma.employee.update({
    where: { id },
    data: { isActive: false },
    include: { deviceInfo: true }
  });

  return sanitizeEmployee(employee);
};

export const deleteEmployee = softDeleteEmployee;

export const changePassword = async (id: string, newPassword: string) => {
  if (!newPassword?.trim() || newPassword.trim().length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  await prisma.employee.update({
    where: { id },
    data: {
      password: await bcrypt.hash(newPassword.trim(), 10)
    }
  });

  return { id };
};

export const regeneratePassword = async (id: string) => {
  const generatedPassword = generatePassword();
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      password: await bcrypt.hash(generatedPassword, 10)
    },
    include: { deviceInfo: true }
  });

  return {
    employee: sanitizeEmployee(employee),
    generatedPassword
  };
};

export const processSmsOnboarding = async (payload: {
  sender: string;
  recipient: string;
  body: string;
}) => {
  const sender = normalizePhoneNumber(payload.sender);
  const recipient = normalizePhoneNumber(payload.recipient);
  const expectedRecipient = normalizePhoneNumber(ADMIN_ONBOARDING_PHONE);
  const replyTo = sender;

  if (recipient !== expectedRecipient) {
    return {
      status: 'ignored' as const,
      replyTo,
      replyMessage: 'Onboarding SMS was not addressed to the configured gateway number.'
    };
  }

  try {
    const { phone, fullName } = parseOnboardingSms(payload.body);
    const existingEmployee = await prisma.employee.findUnique({
      where: { phone },
      select: { employeeCode: true }
    });

    if (existingEmployee) {
      return {
        status: 'duplicate' as const,
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

    await sendSMS(
      sender,
      `Welcome ${fullName}! ID: ${result.employee.employeeCode} Pass: ${result.generatedPassword} APK: ${APK_DOWNLOAD_URL}`
    );

    return {
      status: 'created' as const,
      employeeCode: result.employee.employeeCode,
      replyTo,
      replyMessage: `Welcome ${fullName}!\nID: ${result.employee.employeeCode}\nPass: ${result.generatedPassword}\nAPK: ${APK_DOWNLOAD_URL}`
    };
  } catch (error: any) {
    if (error.message === 'SMS body must match: ID: <mobile_number> <employee_name>') {
      return {
        status: 'invalid_format' as const,
        replyTo,
        replyMessage: 'Invalid format. Please send: ID: <number> <name>'
      };
    }

    throw error;
  }
};

export const handleOnboardingSms = async (payload: any) =>
  processSmsOnboarding({
    sender: payload.sender || payload.from || '',
    recipient: payload.recipient || payload.to || '',
    body: payload.body || payload.message || payload.text || ''
  });

export const updateConsent = async (
  id: string,
  consentData: { consentSigned: boolean; consentDate: Date }
) => {
  return prisma.employee.update({
    where: { id },
    data: consentData
  });
};
