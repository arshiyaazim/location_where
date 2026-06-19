"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecordingUrl = exports.uploadRecording = exports.logCall = void 0;
const database_1 = __importDefault(require("../../config/database"));
const aws_1 = __importDefault(require("../../config/aws"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const encryption_1 = require("../../utils/encryption");
const isS3Configured = () => Boolean(process.env.AWS_ACCESS_KEY_ID?.trim() &&
    process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
    process.env.AWS_REGION?.trim() &&
    process.env.AWS_S3_BUCKET?.trim());
const assertS3Configured = () => {
    if (!isS3Configured()) {
        throw new Error('Call recording storage is not configured');
    }
};
const logCall = async (employeeId, callData) => {
    return database_1.default.callLog.create({
        data: {
            employeeId,
            ...callData,
            startedAt: new Date(callData.startedAt),
            endedAt: new Date(callData.endedAt)
        }
    });
};
exports.logCall = logCall;
const uploadRecording = async (callLogId, file, checksum) => {
    assertS3Configured();
    if (!(0, encryption_1.verifyChecksum)(file.buffer, checksum)) {
        throw new Error('Recording checksum verification failed');
    }
    const key = `recordings/${callLogId}_${Date.now()}.enc`;
    await aws_1.default.send(new client_s3_1.PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    }));
    return database_1.default.callLog.update({
        where: { id: callLogId },
        data: {
            hasRecording: true,
            recordingPath: key,
            recordingEncrypted: true
        }
    });
};
exports.uploadRecording = uploadRecording;
const getRecordingUrl = async (id) => {
    assertS3Configured();
    const call = await database_1.default.callLog.findUnique({ where: { id } });
    if (!call || !call.recordingPath)
        throw new Error('Recording not found');
    const command = new client_s3_1.GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: call.recordingPath
    });
    return (0, s3_request_presigner_1.getSignedUrl)(aws_1.default, command, { expiresIn: 900 }); // 15 min
};
exports.getRecordingUrl = getRecordingUrl;
