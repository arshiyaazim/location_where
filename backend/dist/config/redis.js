"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisReady = exports.connectRedis = void 0;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("../utils/logger"));
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
const isRedisOptional = process.env.REDIS_OPTIONAL === 'true';
redisClient.on('error', (err) => logger_1.default.error('Redis Client Error', err));
const connectRedis = async () => {
    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
            logger_1.default.info('Connected to Redis');
        }
        catch (error) {
            if (isRedisOptional) {
                logger_1.default.warn('Redis unavailable, continuing without cache');
                return;
            }
            throw error;
        }
    }
};
exports.connectRedis = connectRedis;
const isRedisReady = () => redisClient.isOpen;
exports.isRedisReady = isRedisReady;
exports.default = redisClient;
