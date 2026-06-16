"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSchema = exports.mobileLoginSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string().min(3),
        password: zod_1.z.string().min(6),
    }),
});
exports.mobileLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        employeeCode: zod_1.z.string(),
        password: zod_1.z.string(),
        deviceId: zod_1.z.string(),
        fcmToken: zod_1.z.string().optional(),
    }),
});
exports.refreshSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string(),
    }),
});
