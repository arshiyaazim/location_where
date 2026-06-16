"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employeeController = __importStar(require("./employee.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const rbac_middleware_1 = require("../../middleware/rbac.middleware");
const router = (0, express_1.Router)();
router.post('/onboarding/sms', employeeController.smsOnboardingHandler);
router.get('/', auth_middleware_1.authAdmin, rbac_middleware_1.branchFilter, employeeController.getEmployees);
router.post('/', auth_middleware_1.authAdmin, (0, rbac_middleware_1.requireRole)('SUPER_ADMIN', 'HR_MANAGER'), employeeController.createEmployee);
router.put('/:id', auth_middleware_1.authAdmin, (0, rbac_middleware_1.requireRole)('SUPER_ADMIN', 'HR_MANAGER'), employeeController.updateEmployee);
router.delete('/:id', auth_middleware_1.authAdmin, (0, rbac_middleware_1.requireRole)('SUPER_ADMIN', 'HR_MANAGER'), employeeController.deleteEmployee);
router.post('/:id/change-password', auth_middleware_1.authAdmin, (0, rbac_middleware_1.requireRole)('SUPER_ADMIN', 'HR_MANAGER'), employeeController.changePassword);
router.post('/:id/regenerate-password', auth_middleware_1.authAdmin, (0, rbac_middleware_1.requireRole)('SUPER_ADMIN', 'HR_MANAGER'), employeeController.regeneratePassword);
router.post('/:id/password', auth_middleware_1.authAdmin, (0, rbac_middleware_1.requireRole)('SUPER_ADMIN', 'HR_MANAGER'), employeeController.changePassword);
router.post('/:id/password/regenerate', auth_middleware_1.authAdmin, (0, rbac_middleware_1.requireRole)('SUPER_ADMIN', 'HR_MANAGER'), employeeController.regeneratePassword);
router.post('/consent', auth_middleware_1.authEmployee, employeeController.submitConsent);
router.post('/:id/consent', auth_middleware_1.authAdmin, employeeController.submitConsent);
exports.default = router;
