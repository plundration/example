import axios from 'axios';
import { z } from 'zod';

import logger, { formatBody, formatZodError } from '@/services/logger';

// --- Setup ---

export async function initPaymentSystem() {
    await tokenManager.renewToken();
}

// --- Credentials ---

const getCredentialsResponse = z.object({
    token_type: z.string(),
    access_token: z.string(),
    expires_in: z.number().int().positive(),
    refresh_token: z.string(),
});

async function fetchCredentials() {
    // https://doc.gopay.cz/#ziskani-pristupoveho-tokenu

    const response = await axios
        .post(
            `${process.env.GOPAY_API_URL}/oauth2/token`,
            new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'payment-all',
            }),
            {
                headers: {
                    Accept: 'application/json',
                },
                auth: {
                    username: process.env.GOPAY_CLIENT_ID || '',
                    password: process.env.GOPAY_CLIENT_SECRET || '',
                },
            },
        )
        .catch((error) => {
            logger.error(error);
            throw new Error('Failed to fetch credentials');
        });

    if (!response.status) {
        logger.error(response);
        throw new Error('Failed to fetch credentials');
    }

    const parsedData = getCredentialsResponse.safeParse(response.data);
    if (!parsedData.success) {
        logger.error(formatZodError(parsedData.error));
        throw new Error('Failed to parse credential response');
    }

    return parsedData.data;
}

class TokenManager {
    private token: string | null = null;
    private expiresAt: Date | null = null;

    public async renewToken() {
        logger.info('Renewing credentials');
        const credentials = await fetchCredentials();

        this.token = credentials.access_token;
        this.expiresAt = new Date(Date.now() + (credentials.expires_in - 60) * 1000);
        logger.info('Got credentials');
    }

    public async get() {
        if (!this.token || !this.expiresAt || this.expiresAt < new Date()) {
            logger.info('Gopay token expired');
            await this.renewToken();
        }
        return this.token;
    }
}

const tokenManager = new TokenManager();

// --- Payment ---

const createPaymentResponse = z.object({
    id: z.number().int().positive(),
    gw_url: z.string().url(),
});

export async function createPayment(
    price: number,
    transactionId: string,
    contactInfo: { email: string; firstName: string; lastName: string },
) {
    // Full http request example
    // https://doc.gopay.cz/#zalozeni-platby
    // contact - email

    const response = await axios.post(
        `${process.env.GOPAY_API_URL}/payments/payment`,
        {
            target: { type: 'ACCOUNT', goid: `${process.env.GOPAY_ID}` },
            amount: price,
            currency: 'EUR',
            order_number: transactionId,
            callback: {
                return_url: `${process.env.GOPAY_RETURN_URL}/${transactionId}`,
                notification_url: `${process.env.GOPAY_NOTIFICATION_URL}`,
            },
            payer: {
                contact: {
                    first_name: contactInfo.firstName,
                    last_name: contactInfo.lastName,
                    email: contactInfo.email,
                },
            },
            lang: 'SK',
        },
        {
            headers: {
                Authorization: `Bearer ${await tokenManager.get()}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        },
    );

    if (!response.status) {
        logger.error(response);
        throw new Error('Failed to create payment');
    }

    const parsedData = createPaymentResponse.safeParse(response.data);
    if (!parsedData.success) {
        logger.error(formatBody(response.data));
        logger.error(formatZodError(parsedData.error));
        throw new Error('Failed to parse payment response');
    }

    return parsedData.data;
}

// --- Payment status ---

const getPaymentStatusResponse = z.object({
    state: z.string().min(1),
});

/**
 * @param {number} gopayPaymentId - payment id in gopay system
 * @returns Payment status or null if failed
 */
export async function getPaymentStatus(gopayPaymentId: number) {
    const response = await axios.get(
        `${process.env.GOPAY_API_URL}/payments/payment/${gopayPaymentId}`,
        {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Bearer ${await tokenManager.get()}`,
            },
        },
    );

    if (!response.status) {
        logger.error(response);
        throw new Error('Failed to get payment info');
    }

    const parsedData = getPaymentStatusResponse.safeParse(response.data);
    if (!parsedData.success) {
        logger.error(formatBody(response.data));
        logger.error(formatZodError(parsedData.error));
        throw new Error('Failed to parse payment info response');
    }

    return parsedData.data;
}
