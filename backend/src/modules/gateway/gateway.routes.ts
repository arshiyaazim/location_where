import { Router, Request, Response } from 'express';
const router = Router();

router.get('/test', (req: Request, res: Response) => {
  const secret = req.headers['x-gateway-secret'];
  if (!secret || secret !== process.env.SMS_GATEWAY_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/status', (req: Request, res: Response) => {
  const expectedSecret = process.env.SMS_GATEWAY_SECRET?.trim();
  const secret = req.headers['x-gateway-secret'];

  if (!expectedSecret || !secret || secret !== expectedSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      jwt_access_secret: !!process.env.JWT_ACCESS_SECRET,
      jwt_refresh_secret: !!process.env.JWT_REFRESH_SECRET,
      sms_gateway_secret: !!process.env.SMS_GATEWAY_SECRET,
      admin_onboarding_phone: !!process.env.ADMIN_ONBOARDING_PHONE,
      apk_download_url: !!process.env.APK_DOWNLOAD_URL,
      database_url: !!process.env.DATABASE_URL,
    }
  });
});

export default router;
