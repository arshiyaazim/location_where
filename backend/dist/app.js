"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const employee_routes_1 = __importDefault(require("./modules/employee/employee.routes"));
const location_routes_1 = __importDefault(require("./modules/location/location.routes"));
const sim_routes_1 = __importDefault(require("./modules/sim/sim.routes"));
const call_routes_1 = __importDefault(require("./modules/call/call.routes"));
const device_routes_1 = __importDefault(require("./modules/device/device.routes"));
const alert_routes_1 = __importDefault(require("./modules/alert/alert.routes"));
const report_routes_1 = __importDefault(require("./modules/report/report.routes"));
const redis_1 = require("./config/redis");
const logger_1 = __importDefault(require("./utils/logger"));
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const firebase_1 = require("./config/firebase");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimit_middleware_1.apiLimiter);
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/employees', employee_routes_1.default);
app.use('/api/v1/location', location_routes_1.default);
app.use('/api/v1/sim', sim_routes_1.default);
app.use('/api/v1/calls', call_routes_1.default);
app.use('/api/v1/device', device_routes_1.default);
app.use('/api/v1/alerts', alert_routes_1.default);
app.use('/api/v1/reports', report_routes_1.default);
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date(),
        firebaseAdminInitialized: (0, firebase_1.isFirebaseAdminInitialized)()
    });
});
app.use((err, req, res, next) => {
    logger_1.default.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR'
    });
});
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    try {
        await (0, redis_1.connectRedis)();
        app.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
