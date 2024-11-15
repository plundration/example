import { Router, Request, Response } from 'express';
import { z } from 'zod';

import logger, { formatZodError, logErrorReturnNull } from '@/services/logger';

import { getPaymentStatus } from '@/services/gopay';
import { sendTickets } from '@/services/email';

import { getTransaction, createTransaction, updateTransaction } from '@/database/transactions';
import { GopayStateArray } from '@/database/entities/transaction.entity';

const router = Router();
router.get('/', gopayNotificationHandler);
export default router;

// -------------------------
//  GET /gopay_notification
// -------------------------

async function gopayNotificationHandler(req: Request, res: Response) {
    const parsedId = z.coerce.number().int().positive().safeParse(req.query.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }

    const gopayId = parsedId.data;
    logger.info(`Received notification for transaction "${gopayId}"`);

    const paymentStatus = await getPaymentStatus(gopayId).catch(logErrorReturnNull);
    if (!paymentStatus || !paymentStatus.state) {
        return res.status(400).json({ message: 'Failed to get payment status' });
    }

    const transaction = await getTransaction({ gopayId: gopayId }).catch(logErrorReturnNull);
    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    }

    logger.info(`Transaction "${transaction.id}" state: ${paymentStatus.state}`);

    const parsedState = z.enum(GopayStateArray).safeParse(paymentStatus.state);
    if (!parsedState.success) {
        return res.status(500).json({ message: 'Invalid state' });
    }
    const state = parsedState.data;

    transaction.state = state;
    const saveResult = await createTransaction(transaction).catch(logErrorReturnNull);
    if (!saveResult) {
        return res.status(500).json({ message: 'Failed to update transaction' });
    }

    logger.info(`Transaction updated`);

    if (state !== 'PAID') {
        return res.sendStatus(200);
    }

    logger.info(`Sending tickets`);

    try {
        await sendTickets(transaction.tickets, transaction.email);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to send ticket' });
    }

    logger.info(`Tickets sent`);

    transaction.sent = true;
    const saved = await updateTransaction(transaction).catch(logErrorReturnNull);
    if (!saved) {
        return res.status(500).json({ message: 'Failed to update transaction' });
    }

    return res.sendStatus(200);
}
