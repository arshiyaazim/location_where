import prisma from '../../config/database';
import bcrypt from 'bcryptjs';

export const getAllEmployees = async (filters: any) => {
  const { page = 1, limit = 20, branchId, search, status } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (status === 'active') where.isActive = true;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { employeeCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: Number(limit),
      include: { deviceInfo: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.employee.count({ where })
  ]);

  return { data, total, page: Number(page) };
};

export const createEmployee = async (employeeData: any) => {
  const hashedPassword = await bcrypt.hash(employeeData.password || 'welcome123', 10);
  return prisma.employee.create({
    data: {
      ...employeeData,
      password: hashedPassword
    }
  });
};

export const updateConsent = async (id: string, consentData: { consentSigned: boolean; consentDate: Date }) => {
  return prisma.employee.update({
    where: { id },
    data: consentData
  });
};
