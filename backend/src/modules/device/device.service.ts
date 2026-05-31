import prisma from '../../config/database';
import admin from '../../config/firebase';

export const sendRemoteLock = async (employeeId: string, adminId: string) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { deviceInfo: true }
  });

  if (!employee || !employee.fcmToken) {
    throw new Error('Employee or device FCM token not found');
  }

  // Create command in DB
  const command = await prisma.remoteCommand.create({
    data: {
      employeeId,
      adminId,
      commandType: 'LOCK',
      status: 'SENT',
      sentAt: new Date()
    }
  });

  // Send FCM
  try {
    await admin.messaging().send({
      token: employee.fcmToken,
      data: {
        type: 'REMOTE_COMMAND',
        command: 'LOCK',
        commandId: command.id
      },
      android: {
        priority: 'high'
      }
    });
  } catch (error) {
    console.error('FCM Error:', error);
    // Even if FCM fails, the command is recorded
  }

  return command;
};
