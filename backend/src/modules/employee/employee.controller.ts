import { Request, Response } from 'express';
import * as employeeService from './employee.service';

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const result = await employeeService.getAllEmployees(req.query);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const result = await employeeService.createEmployee(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const submitConsent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await employeeService.updateConsent(id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
