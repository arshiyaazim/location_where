import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import redisClient from '../../config/redis';
import { sendSMS } from '../../utils/sms';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is not set');

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not set');

export const generateTokens = (payload: any) => {
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as jwt.JwtPayload;
    const payload = {
      id: decoded.id,
      role: decoded.role,
      branchId: decoded.branchId,
    };

    return {
      accessToken: jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
    };
  } catch {
    throw new Error('Invalid refresh token');
  }
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

  await redisClient.set(`otp:${employeeCode}`, otp, { EX: 300 });
  await sendSMS(employee.phone, `Your monitoring app verification code is: ${otp}`);
  return { message: 'OTP sent to registered phone number' };
};

export const employeeMobileLogin = async (
  employeeCode: string,
  password: string,
  deviceId: string,
  fcmToken?: string
) => {
  const employee = await prisma.employee.findUnique({ where: { employeeCode } });
  if (!employee || !employee.isActive) throw new Error('Invalid employee credentials');

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) throw new Error('Invalid employee credentials');

  await prisma.employee.update({
    where: { id: employee.id },
    data: {
      deviceId,
      ...(fcmToken ? { fcmToken } : {})
    }
  });

  return {
    ...generateTokens({ id: employee.id, role: 'EMPLOYEE', branchId: employee.branchId }),
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      employeeCode: employee.employeeCode,
      department: employee.department,
      designation: employee.designation
    }
  };
};

export const verifyOTP = async (employeeCode: string, otp: string, deviceId: string) => {
  const employee = await prisma.employee.findUnique({ where: { employeeCode } });
  if (!employee) throw new Error('Invalid employee code');

  const storedOtp = await redisClient.get(`otp:${employeeCode}`);
  if (!storedOtp || storedOtp !== otp) {
    throw new Error('Invalid or expired OTP');
  }
  await redisClient.del(`otp:${employeeCode}`);

  await prisma.employee.update({
    where: { id: employee.id },
    data: { deviceId }
  });

  return {
    ...generateTokens({ id: employee.id, role: 'EMPLOYEE' }),
    employee: { id: employee.id, fullName: employee.fullName, employeeCode: employee.employeeCode }
  };
};
