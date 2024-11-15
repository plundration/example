import { Router, Request, Response } from 'express';
import { z } from 'zod';

import logger, { formatZodError, logErrorReturnNull } from '@/services/logger';

import { userHasPermissionsMiddleware } from '@/services/firebase';

import database from '@/database/database';
import { Promo } from '@/database/entities/promo.entity';
import { Event } from '@/database/entities/event.entity';

const router = Router();
router.get('/', userHasPermissionsMiddleware('read-all'), listPromosHandler);
router.get('/check', getPromoDiscountHandler);
router.get('/:id', userHasPermissionsMiddleware('read-all'), getPromoHandler);
router.post('/', userHasPermissionsMiddleware('modify-all'), createPromoHandler);
router.patch('/:id', userHasPermissionsMiddleware('modify-all'), patchPromoHandler);
export default router;

// -------------------
//  GET /promos
// -------------------

const listPromosSchema = z
    .object({
        eventId: z.coerce.number().int().positive(),
        orderBy: z.enum(['eventId', 'discountPercent', 'createdAt']).default('createdAt'),
        order: z.enum(['ASC', 'DESC']).default('DESC'),
    })
    .partial();

async function listPromosHandler(req: Request, res: Response) {
    const parsedData = listPromosSchema.safeParse(req.query);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }
    const data = parsedData.data;

    let query = database.getRepository(Promo).createQueryBuilder('promo');

    if (data.eventId) query = query.andWhere('promo.eventId = :eventId', { eventId: data.eventId });
    if (data.orderBy) query = query.orderBy(data.orderBy, data.order ?? 'DESC');

    const result = await query.getMany().catch(logErrorReturnNull);
    if (!result) {
        return res.status(500).json({ message: 'Failed to fetch events' });
    }

    logger.info(`Found ${result.length} promos`);
    return res.json(result);
}

// -----------------------
//  GET /promos/:id
// -----------------------

async function getPromoHandler(req: Request, res: Response) {
    const parsedId = z.string().safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }

    const id = parsedId.data;
    const promo = await database.getRepository(Promo).findOne({ where: { id } });
    if (!promo) {
        return res.status(404).json({ message: `Promo "${id}" not found` });
    }

    logger.info(`Found promo "${id}"`);
    logger.info(promo);
    return res.json(promo);
}

// -----------------------------
//  GET /promos/check?...
// -----------------------------

const getPromoDiscountSchema = z.object({
    promoCode: z.string().min(1),
    eventId: z.coerce.number().int().positive(),
});

async function getPromoDiscountHandler(req: Request, res: Response) {
    const parseData = getPromoDiscountSchema.safeParse(req.query);
    if (!parseData.success) {
        return res.status(400).json({ message: formatZodError(parseData.error) });
    }

    const { promoCode, eventId } = parseData.data;
    const promo = await database
        .getRepository(Promo)
        .findOne({ where: { code: promoCode, event: { id: eventId } } });

    if (!promo) {
        return res.status(404).json({ message: 'Promo kód nebol nájdený' });
    }

    if (!promo.enabled) {
        return res.status(403).json({ message: 'Promo kód nie je aktívny' });
    }

    return res.json({ discountPercent: promo.discountPercent });
}

// --------------------
//  POST /promos
// --------------------

const createPromoSchema = z.object({
    eventId: z.coerce.number().int().positive(),
    code: z.string().min(1),
    discountPercent: z.coerce.number().int().positive(),
    enabled: z.boolean().default(true),
});

async function createPromoHandler(req: Request, res: Response) {
    const parsedData = createPromoSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }
    const data = parsedData.data;

    const event = await database.getRepository(Event).findOne({ where: { id: data.eventId } });
    if (!event) {
        return res.status(404).json({ message: 'Event not found' });
    }

    const promo = { ...data, event };
    const saveResult = await database.getRepository(Promo).save(promo);
    return res.json(saveResult);
}

// -------------------------
//  PATCH /promos/:id
// -------------------------

const patchPromoSchema = z
    .object({
        code: z.string().min(1),
        discountPercent: z.coerce.number().int().positive(),
        enabled: z.boolean(),
    })
    .partial();

async function patchPromoHandler(req: Request, res: Response) {
    const parsedId = z.string().safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }
    const id = parsedId.data;

    const promo = await database.getRepository(Promo).findOne({ where: { id } });
    if (!promo) {
        return res.status(404).json({ message: 'Promo not found' });
    }

    const parsedData = patchPromoSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }

    const data = parsedData.data;
    const saveResult = await database.getRepository(Promo).save({ ...promo, ...data });

    return res.json(saveResult);
}
