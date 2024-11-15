import { Router, Request, Response } from 'express';
import { z } from 'zod';

import logger, { formatZodError, logErrorReturnNull } from '@/services/logger';

import { createTicket, createTicketsOrFail, deleteTicket } from '@/database/tickets';

import { createPayment } from '@/services/gopay';
import { userHasPermissionsMiddleware } from '@/services/firebase';

import {
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from '@/database/transactions';
import database from '@/database/database';
import { GopayStateArray, Transaction } from '@/database/entities/transaction.entity';
import { Promo } from '@/database/entities/promo.entity';

const router = Router();
router.get('/', userHasPermissionsMiddleware('read-all'), listTransactionsHandler);
router.get('/status', getTransactionStatusHandler);
router.get('/:id', userHasPermissionsMiddleware('scan'), getTransactionHandler);
router.post('/', startTransactionHandler);
router.patch('/:id', userHasPermissionsMiddleware('modify-all'), patchTransactionHandler);
export default router;

// -------------------
//  GET /transactions
// -------------------

function checkRangeValid(min: number | undefined, max: number | undefined) {
    return !min || !max || min <= max;
}

function checkDateRange(dateMin: string | undefined, dateMax: string | undefined) {
    return !dateMin || !dateMax || new Date(dateMin) <= new Date(dateMax);
}

const listTransactionsSchema = z
    .object({
        gopayId: z.coerce.number().int().positive(),
        email: z.string().email(),
        createdAfter: z.string().datetime(),
        createdBefore: z.string().datetime(),
        priceMin: z.coerce.number().int().positive(),
        priceMax: z.coerce.number().int().positive(),
        state: z.enum(GopayStateArray),
        sent: z.enum(['true', 'false']).transform((v) => v === 'true'),
        orderBy: z.enum(['price', 'createdAt']).default('createdAt'),
        order: z.enum(['ASC', 'DESC']).default('DESC'),
    })
    .partial()
    .refine((d) => checkDateRange(d.createdAfter, d.createdBefore), {
        message: 'Invalid range',
        path: ['createdAfter and createdBefore'],
    })
    .refine((d) => checkRangeValid(d.priceMin, d.priceMax), {
        message: 'Invalid range',
        path: ['priceMin', 'priceMax'],
    });

async function listTransactionsHandler(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const parsedQuery = listTransactionsSchema.safeParse(req.query);
    if (!parsedQuery.success) {
        return res.status(400).json({ message: formatZodError(parsedQuery.error) });
    }

    const data = parsedQuery.data;
    let query = database.getRepository(Transaction).createQueryBuilder('transaction');

    if (data.gopayId)
        query = query.andWhere('transaction.gopayId = :gopayId', { gopayId: data.gopayId });

    logger.info(data);

    if (data.email) query = query.andWhere('transaction.email = :email', { email: data.email });
    if (data.createdAfter)
        query = query.andWhere('transaction.createdAt >= :createdAfter', {
            createdAfter: data.createdAfter,
        });
    if (data.createdBefore)
        query = query.andWhere('transaction.createdAt <= :createdBefore', {
            createdBefore: data.createdBefore,
        });
    if (data.priceMin)
        query = query.andWhere('transaction.price >= :priceMin', { priceMin: data.priceMin });
    if (data.priceMax)
        query = query.andWhere('transaction.price <= :priceMax', { priceMax: data.priceMax });
    if (data.state) query = query.andWhere('transaction.state = :state', { state: data.state });
    if (data.sent !== undefined)
        query = query.andWhere('transaction.sent = :sent', { sent: data.sent });

    query = query.leftJoinAndSelect('transaction.tickets', 'ticket');

    if (data.orderBy) query = query.orderBy(data.orderBy, data.order ?? 'ASC');

    const result = await query.getMany().catch(logErrorReturnNull);

    if (!result) {
        return res.status(500).json({ message: 'Failed to fetch transactions' });
    }

    logger.info(`Found ${result.length} transactions`);
    return res.json(result);
}

// -----------------------
//  GET /transactions/:id
// -----------------------

async function getTransactionHandler(req: Request, res: Response) {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const parsedId = z.string().safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }

    const id = parsedId.data;
    const transaction = await getTransaction({ id }).catch(logErrorReturnNull);
    if (!transaction) {
        return res.status(404).json({ message: `Transaction "${id}" not found` });
    }

    logger.info(`Found transaction "${id}"`);
    logger.info(transaction);
    return res.json(transaction);
}

// ------------------------------
//  GET /transactions/status
// ------------------------------

const getTransactionStatusSchema = z.object({
    id: z.string(),
    gopayId: z.coerce.number().int().positive(),
});

async function getTransactionStatusHandler(req: Request, res: Response) {
    const parseData = getTransactionStatusSchema.safeParse(req.query);
    if (!parseData.success) {
        return res.status(400).json({ message: formatZodError(parseData.error) });
    }

    const { gopayId, id } = parseData.data;
    const transaction = await getTransaction({ id }).catch(logErrorReturnNull);
    if (!transaction) {
        return res.status(404).json({ message: `Transaction not found` });
    }

    logger.info(transaction);

    if (transaction.gopayId?.toString() !== gopayId.toString()) {
        logger.info(`Transaction ID mismatch: ${transaction.gopayId} !== ${gopayId}`);
        return res.status(400).json({ message: 'Transaction ID mismatch' });
    }

    return res.json(transaction);
}

// --------------------
//  POST /transactions
// --------------------

const startTransactionSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    eventId: z.number().int().positive(),
    ticketTypeName: z.string().min(1),
    ticketAmount: z.number().int().positive().min(1).max(6),
    newsletter: z.boolean(),
    promoCode: z.string(),
});

async function startTransactionHandler(req: Request, res: Response) {
    const parsedData = startTransactionSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }

    const data = parsedData.data;

    let promo = null;
    if (data.promoCode) {
        logger.info(`Checking promo code "${data.promoCode}" for event "${data.eventId}"`);

        promo = await database.getRepository(Promo).findOneBy({ code: data.promoCode });
        if (!promo) {
            return res.status(404).json({ message: `Promo code "${data.promoCode}" not found` });
        }
        if (promo.eventId !== data.eventId) {
            return res
                .status(400)
                .json({ message: `Promo code "${data.promoCode}" not valid for this event` });
        }
        if (!promo.enabled) {
            return res
                .status(400)
                .json({ message: `Promo code "${data.promoCode}" is not enabled` });
        }
    }

    let tickets;

    try {
        tickets = await createTicketsOrFail(
            data.eventId,
            data.ticketTypeName,
            data.ticketAmount,
            promo,
        );
    } catch (err: any) {
        logger.error(err);
        return res.status(400).json({ message: err.message });
    }

    const price = tickets[0].price * data.ticketAmount;

    logger.info(`Tickets: ${tickets.length}, price: ${price}`);

    const transaction = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        price: price,
        tickets: tickets,
        promo: promo ?? undefined,
    };

    const saveResult = await database
        .getRepository(Transaction)
        .save(transaction)
        .catch(logErrorReturnNull);

    if (!saveResult) {
        return res.status(500).json({ message: 'Failed to create transaction' });
    }

    const payment = await createPayment(price, saveResult.id, data).catch(logErrorReturnNull);

    if (!payment) {
        await deleteTransaction(saveResult.id).catch(logErrorReturnNull);
        return res.status(500).json({ message: 'Failed to create payment' });
    }

    saveResult.gopayId = payment.id;
    const finalSaveResult = await updateTransaction(saveResult).catch(logErrorReturnNull);
    if (!finalSaveResult) {
        return res.status(500).json({ message: 'Failed to update transaction' });
    }

    return res.json({ gw_url: payment.gw_url });
}

// -------------------------
//  PATCH /transactions/:id
// -------------------------

async function patchTransactionHandler(req: Request, res: Response) {
    const parsedId = z.string().safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }
    const id = parsedId.data;

    const transaction = await getTransaction({ id }).catch(logErrorReturnNull);
    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    }

    const parsedState = z.enum(GopayStateArray).safeParse(req.body.state);
    if (!parsedState.success) {
        return res.status(400).json({ message: formatZodError(parsedState.error) });
    }

    transaction.state = parsedState.data;
    const saveResult = await createTransaction(transaction).catch(logErrorReturnNull);
    if (!saveResult) {
        return res.status(400).json({ message: 'Failed to update transaction' });
    }

    return res.json(saveResult);
}
