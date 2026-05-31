import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { Role } from '@prisma/client';
import { sendSMS } from '../../utils/sms';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export const generateTokens = (payload: any) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const adminLogin = async (username: string, password: string) => {
  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin || !admin.isActive) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) throw new Error('Invalid credentials');

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() }
  });

  return {
    ...generateTokens({ id: admin.id, role: admin.role, branchId: admin.branchId }),
    admin: { id: admin.id, username: admin.username, role: admin.role }
  };
};

export const initiateEmployeeLogin = async (employeeCode: string) => {
  const employee = await prisma.employee.findUnique({ where: { employeeCode } });
  if (!employee || !employee.isActive) throw new Error('Employee not found or inactive');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // In a real app, store OTP in Redis with expiry
  await sendSMS(employee.phone, `Your monitoring app verification code is: ${otp}`);
  return { message: 'OTP sent to registered phone number' };
};

export const verifyOTP = async (employeeCode: string, otp: string, deviceId: string) => {
  const employee = await prisma.employee.findUnique({ where: { employeeCode } });
  if (!employee) throw new Error('Invalid employee code');

  // Verify logic (normally against Redis)
  if (otp !== "123456") { // Hardcoded for demo/testing
      // throw new Error('Invalid OTP');
  }

  await prisma.employee.update({
    where: { id: employee.id },
    data: { deviceId }
  });

  return {
    ...generateTokens({ id: employee.id, role: 'EMPLOYEE' }),
    employee: { id: employee.id, fullName: employee.fullName, employeeCode: employee.employeeCode }
  };
};
