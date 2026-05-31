import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as deviceService from './device.service';

export const lockDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.body;
    const adminId = req.user.id;
    const result = await deviceService.sendRemoteLock(employeeId, adminId);
    res.json({ success: true, data: result, message: 'Lock command sent' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
