import { Request, Response } from 'express';
import * as authService from './auth.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await authService.adminLogin(username, password);
    res.json({ success: true, data: result, message: 'Login successful' });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message, code: 'AUTH_FAILED' });
  }
};

export const initiateMobileLogin = async (req: Request, res: Response) => {
  try {
    const { employeeCode } = req.body;
    const result = await authService.initiateEmployeeLogin(employeeCode);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { employeeCode, otp, deviceId } = req.body;
    const result = await authService.verifyOTP(employeeCode, otp, deviceId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
