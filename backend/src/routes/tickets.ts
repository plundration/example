import { Router, Request, Response } from 'express';
import { z } from 'zod';

import logger, { formatZodError, logErrorReturnNull } from '@/services/logger';
import { userHasPermissionsMiddleware } from '@/services/firebase';
import { listTickets, getTicket, createTicket, updateTicketScannedAt } from '@/database/tickets';
import { Ticket } from '@/database/entities/ticket.entity';
import database from '@/database/database';

const router = Router();
router.get('/', userHasPermissionsMiddleware('read-all'), getTicketsHandler);
router.get('/:id/scan', userHasPermissionsMiddleware('scan'), scanTicketHandler);
router.get('/:id', userHasPermissionsMiddleware('scan'), getTicketHandler);
router.post('/', userHasPermissionsMiddleware('modify-all'), postTicketHandler);
router.patch('/:id', userHasPermissionsMiddleware('unscan'), patchTicketHandler);
export default router;

// --------------
//  GET /tickets
// --------------

function checkRangeValid(min: number | undefined, max: number | undefined) {
    return !min || !max || min <= max;
}

function checkDateRange(dateMin: string | undefined, dateMax: string | undefined) {
    return !dateMin || !dateMax || new Date(dateMin) <= new Date(dateMax);
}

const getTicketsSchema = z
    .object({
        eventId: z.coerce.number().int().positive(),
        ticketTypeName: z.string().min(1),
        priceMin: z.coerce.number().int().positive(),
        priceMax: z.coerce.number().int().positive(),
        scanned: z.enum(['true', 'false']).transform((v) => v === 'true'),
        scannedAfter: z.string().datetime(),
        scannedBefore: z.string().datetime(),
        createdAfter: z.string().datetime(),
        createdBefore: z.string().datetime(),
        orderBy: z.enum(['scannedAt', 'createdAt']).default('createdAt'),
        order: z.enum(['ASC', 'DESC']).default('DESC'),
    })
    .partial()
    .refine((d) => checkRangeValid(d.priceMin, d.priceMax), {
        message: 'Invalid range',
        path: ['priceMin', 'priceMax'],
    })
    .refine((d) => checkDateRange(d.scannedAfter, d.scannedBefore), {
        message: 'Invalid range',
        path: ['scannedAfter and scannedBefore'],
    })
    .refine((d) => checkDateRange(d.createdAfter, d.createdBefore), {
        message: 'Invalid range',
        path: ['createdAfter and createdBefore'],
    });

async function getTicketsHandler(req: Request, res: Response) {
    const parsedData = getTicketsSchema.safeParse(req.query);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }
    const data = parsedData.data;

    let query = database.getRepository(Ticket).createQueryBuilder('ticket');

    if (data.eventId)
        query = query.andWhere('ticket.eventId = :eventId', { eventId: data.eventId });

    if (data.ticketTypeName)
        query = query.andWhere('ticket.ticketTypeName = :ticketTypeName', {
            ticketTypeName: data.ticketTypeName,
        });

    if (data.priceMin)
        query = query.andWhere('ticket.price >= :priceMin', { priceMin: data.priceMin });
    if (data.priceMax)
        query = query.andWhere('ticket.price <= :priceMax', { priceMax: data.priceMax });

    if (data.scanned === true) query = query.andWhere('ticket.scannedAt IS NOT NULL');
    if (data.scanned === false) query = query.andWhere('ticket.scannedAt IS NULL');

    if (data.scannedAfter)
        query = query.andWhere('ticket.scannedAt <= :scannedAfter', {
            scannedAfter: data.scannedAfter,
        });
    if (data.scannedBefore)
        query = query.andWhere('ticket.scannedAt >= :scannedBefore', {
            scannedBefore: data.scannedBefore,
        });

    if (data.createdAfter)
        query = query.andWhere('ticket.createdAt <= :createdAfter', {
            createdAfter: data.createdAfter,
        });
    if (data.createdBefore)
        query = query.andWhere('ticket.createdAt >= :createdBefore', {
            createdBefore: data.createdBefore,
        });

    if (data.orderBy) query = query.orderBy(data.orderBy, data.order ?? 'ASC');

    const result = await query.getMany().catch(logErrorReturnNull);
    if (!result) {
        return res.status(500).json({ message: 'Failed to fetch events' });
    }

    logger.info(`Found ${result.length} tickets`);
    return res.json(result);
}

// ------------------
//  GET /tickets/:id
// ------------------

async function getTicketHandler(req: Request, res: Response) {
    const parsedId = z.string().min(1).safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }

    const id = parsedId.data;
    const ticket = await getTicket({ id }).catch(logErrorReturnNull);
    if (!ticket) {
        return res.status(404).json({ message: `Failed to fetch ticket "${id}"` });
    }

    logger.info(`Found ticket "${id}"`);
    return res.json(ticket);
}

// ----------------------------------
//  GET /ticket/:id/scan?eventId=...
// ----------------------------------

async function scanTicketHandler(req: Request, res: Response) {
    const parseTicketId = z.string().min(1).safeParse(req.params.id);
    if (!parseTicketId.success) {
        return res.status(400).json({ message: formatZodError(parseTicketId.error) });
    }

    const parseEventId = z.coerce.number().int().positive().safeParse(req.query.eventId);
    if (!parseEventId.success) {
        return res.status(400).json({ message: formatZodError(parseEventId.error) });
    }

    const id = parseTicketId.data;
    const eventId = parseEventId.data;
    const ticket = await getTicket({ id, event: { id: eventId } }).catch(logErrorReturnNull);
    if (!ticket) {
        return res.status(404).json({ message: `Ticket not found` });
    }

    if (ticket.scannedAt) {
        return res.status(400).json({ message: `Ticket already scanned`, ticket });
    }

    const result = await updateTicketScannedAt(id, true).catch(logErrorReturnNull);
    if (!result) {
        return res.status(500).json({ message: `Failed to scan ticket` });
    }

    return res.json({ ticket });
}

// ---------------
//  POST /tickets
// ---------------

const postTicketSchema = z.object({
    eventId: z.coerce.number().int().positive(),
    ticketTypeName: z.string().min(1),
});

async function postTicketHandler(req: Request, res: Response) {
    const parsedResult = postTicketSchema.safeParse(req.body);
    if (!parsedResult.success) {
        return res.status(400).json({ message: parsedResult.error.format() });
    }

    const data = parsedResult.data;
    const ticket = await createTicket(data.eventId, data.ticketTypeName).catch(logErrorReturnNull);
    if (!ticket) {
        return res.status(404).json({ message: `Event "${data.eventId}" not found` });
    }

    logger.info(`Created ticket (${ticket.id}) for event "${data.eventId}"`);
    logger.info(ticket);
    return res.json(ticket);
}

// --------------------
//  PATCH /tickets/:id
// --------------------

const patchTicketSchema = z.object({
    id: z.string().min(1),
    scanned: z.boolean(),
});

async function patchTicketHandler(req: Request, res: Response) {
    const parsedData = patchTicketSchema.safeParse({
        id: req.params.id,
        scanned: req.body.scanned,
    });

    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }

    const data = parsedData.data;
    const ticket = await updateTicketScannedAt(data.id, data.scanned).catch(logErrorReturnNull);
    if (!ticket) {
        return res.status(404).json({ message: `Failed to update ticket "${data.id}"` });
    }

    logger.info(`Updated ticket ${data.id}`);
    return res.json(ticket);
}
