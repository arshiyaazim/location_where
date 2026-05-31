import { Request, Response } from 'express';
import * as locationService from './location.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const updateLocation = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user.id;
    const result = await locationService.logLocation(employeeId, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLive = async (req: AuthRequest, res: Response) => {
  try {
    const branchId = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.branchId;
    const employees = await locationService.getLiveLocations(branchId);
    res.json({ success: true, data: { employees } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getEmployeeHistory = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { from, to } = req.query;
    const routes = await locationService.getHistory(
      employeeId,
      new Date(from as string),
      new Date(to as string)
    );
    res.json({ success: true, data: { routes } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
