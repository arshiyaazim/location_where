"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchFilter = exports.requireRole = void 0;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: You do not have permission',
                code: 'FORBIDDEN'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
const branchFilter = (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.branchId) {
        // Inject branch filter into request for services to use
        req.query.branchId = req.user.branchId;
    }
    next();
};
exports.branchFilter = branchFilter;
