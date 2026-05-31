import prisma from '../../config/database';
import redisClient from '../../config/redis';

export const logLocation = async (employeeId: string, locationData: any) => {
  const { latitude, longitude, accuracy, batteryLevel } = locationData;

  // Save to PostgreSQL
  const log = await prisma.locationLog.create({
    data: {
      employeeId,
      latitude,
      longitude,
      accuracy,
      batteryLevel,
      recordedAt: new Date()
    }
  });

  // Update live cache in Redis
  await redisClient.hSet('live_locations', employeeId, JSON.stringify({
    latitude,
    longitude,
    batteryLevel,
    lastSeen: new Date(),
    id: employeeId
  }));

  return log;
};

export const getLiveLocations = async (branchId?: string) => {
  const allLocations = await redisClient.hGetAll('live_locations');
  const employees = Object.values(allLocations).map(loc => JSON.parse(loc));

  // If branchId is provided, filter based on employee's branch (might need to fetch employee data if not in cache)
  return employees;
};

export const getHistory = async (employeeId: string, from: Date, to: Date) => {
  return prisma.locationLog.findMany({
    where: {
      employeeId,
      recordedAt: { gte: from, lte: to }
    },
    orderBy: { recordedAt: 'asc' }
  });
};
