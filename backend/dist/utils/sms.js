"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = void 0;
const logger_1 = __importDefault(require("./logger"));
const getRequiredEnv = (key) => {
    const value = process.env[key]?.trim();
    if (!value) {
        throw new Error(`${key} is not configured`);
    }
    return value;
};
const normalizeSslWirelessNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('880') && digits.length === 13) {
        return digits;
    }
    if (digits.startsWith('01') && digits.length === 11) {
        return `880${digits.slice(1)}`;
    }
    throw new Error('SMS destination must be a valid Bangladesh mobile number');
};
const sendSMS = async (phone, message) => {
    const domain = getRequiredEnv('SMS_DOMAIN');
    const token = getRequiredEnv('SMS_API_TOKEN');
    const sid = getRequiredEnv('SMS_SID');
    const to = normalizeSslWirelessNumber(phone);
    const endpoint = new URL('/api/v1/send-sms', domain).toString();
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            api_token: token,
            sid,
            msisdn: to,
            sms: message,
            csms_id: `lw-${Date.now()}`
        })
    });
    const rawResponse = await response.text();
    let parsedResponse = null;
    try {
        parsedResponse = rawResponse ? JSON.parse(rawResponse) : null;
    }
    catch {
        parsedResponse = rawResponse;
    }
    const statusCode = parsedResponse?.status_code ??
        parsedResponse?.status ??
        parsedResponse?.response_code ??
        null;
    const isSuccess = response.ok && !['4005', '4006', '4007', '4008', '4009'].includes(String(statusCode));
    if (!isSuccess) {
        logger_1.default.error('ssl_wireless_sms_failed', {
            endpoint,
            phone: to,
            responseStatus: response.status,
            providerStatus: statusCode,
            providerMessage: parsedResponse?.error_message || parsedResponse?.message || rawResponse || 'Unknown response'
        });
        throw new Error(`SSL Wireless SMS send failed (${response.status}${statusCode ? `/${statusCode}` : ''})`);
    }
    logger_1.default.info('ssl_wireless_sms_sent', {
        phone: to,
        responseStatus: response.status,
        providerStatus: statusCode ?? 'OK'
    });
};
exports.sendSMS = sendSMS;
