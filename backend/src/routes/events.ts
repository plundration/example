import { Router, Request, Response } from 'express';
import { z } from 'zod';

import logger, { formatZodError, logErrorReturnNull } from '@/services/logger';
import { userHasPermissionsMiddleware } from '@/services/firebase';

import database from '@/database/database';
import { getEvent, createEvent, updateEvent, deleteEvent } from '@/database/events';
import { Event } from '@/database/entities/event.entity';

const router = Router();
router.get('/', userHasPermissionsMiddleware('read-all'), listEventsHandler);
router.get('/upcoming', getUpcomingEventHandler);
router.get('/gallery', getEventGalleryHandler);
router.get('/:id', getEventHandler);
router.post('/', userHasPermissionsMiddleware('modify-all'), postEventHandler);
router.patch('/:id', userHasPermissionsMiddleware('modify-all'), patchEventHandler);
router.delete('/:id', userHasPermissionsMiddleware('modify-all'), deleteEventHandler);
export default router;

// -------------
//  GET /events
// -------------

function checkRangeValid(min: number | undefined, max: number | undefined) {
    return !min || !max || min <= max;
}

function checkDateRange(dateMin: string | undefined, dateMax: string | undefined) {
    return !dateMin || !dateMax || new Date(dateMin) <= new Date(dateMax);
}

const listEventsSchema = z
    .object({
        name: z.string(),
        dateMin: z.string().datetime(),
        dateMax: z.string().datetime(),
        ticketsMin: z.coerce.number().int().positive(),
        ticketsMax: z.coerce.number().int().positive(),
        soldOut: z.enum(['true', 'false']).transform((v) => v === 'true'),
        sellingOpen: z.enum(['true', 'false']).transform((v) => v === 'true'),
        galleryEnabled: z.enum(['true', 'false']).transform((v) => v === 'true'),
        orderBy: z.enum(['name', 'date', 'capacity', 'price', 'tickets']).default('date'),
        order: z.enum(['ASC', 'DESC']).default('ASC'),
    })
    .partial()
    .refine((d) => checkDateRange(d.dateMin, d.dateMax), {
        message: 'Invalid range',
        path: ['dateMin and dateMax'],
    })
    .refine((d) => checkRangeValid(d.ticketsMin, d.ticketsMax), {
        message: 'Invalid range',
        path: ['ticketsMin', 'ticketsMax'],
    });

async function listEventsHandler(req: Request, res: Response) {
    const parsedQuery = listEventsSchema.safeParse(req.query);
    if (!parsedQuery.success) {
        return res.status(400).json({ message: formatZodError(parsedQuery.error) });
    }

    const data = parsedQuery.data;
    logger.info(data);

    let query = database.getRepository(Event).createQueryBuilder('event');

    if (data.name) query = query.andWhere('event.name = :name', { name: data.name });
    if (data.dateMin) query = query.andWhere('event.date >= :dateMin', { dateMin: data.dateMin });
    if (data.dateMax) query = query.andWhere('event.date <= :dateMax', { dateMax: data.dateMax });

    if (data.soldOut !== undefined)
        query = query.andWhere('event.soldOut = :soldOut', { soldOut: data.soldOut });

    if (data.sellingOpen !== undefined)
        query = query.andWhere('event.sellingOpen = :sellingOpen', {
            sellingOpen: data.sellingOpen,
        });

    if (data.galleryEnabled !== undefined)
        query = query.andWhere('event.galleryEnabled = :galleryEnabled', {
            galleryEnabled: data.galleryEnabled,
        });

    if (data.ticketsMin || data.ticketsMax || data.orderBy === 'tickets')
        query = query.leftJoin('event.tickets', 'ticket').groupBy('event.id');

    if (data.ticketsMin)
        query = query.andHaving('COUNT(ticket.id) >= :ticketsMin', { ticketsMin: data.ticketsMin });
    if (data.ticketsMax)
        query = query.andHaving('COUNT(ticket.id) <= :ticketsMax', { ticketsMax: data.ticketsMax });

    if (data.orderBy === 'tickets') query = query.orderBy('COUNT(ticket.id)', data.order ?? 'ASC');
    else if (data.orderBy) query = query.orderBy(data.orderBy, data.order ?? 'ASC');

    query = query.loadRelationCountAndMap('event.ticketCount', 'event.tickets');

    const result = await query.getMany().catch(logErrorReturnNull);

    if (!result) {
        return res.status(500).json({ message: 'Failed to fetch events' });
    }

    logger.info(`Found ${result.length} events`);
    return res.json(result);
}

// ---------------------
// GET /events/upcoming
// ---------------------

async function getUpcomingEventHandler(req: Request, res: Response) {
    const openEventQuery = database
        .getRepository(Event)
        .createQueryBuilder('event')
        .where('event.date >= :dateMin', { dateMin: new Date().toISOString() })
        .andWhere('event.sellingOpen = :sellingOpen', { sellingOpen: true })
        .andWhere('event.soldOut = :soldOut', { soldOut: false })
        .orderBy('date', 'ASC');

    const openEvent = await openEventQuery.getOne().catch(logErrorReturnNull);

    if (openEvent) {
        logger.info(`Found event with open selling: ${openEvent.id}`);
        return res.json(openEvent);
    }

    const upcomingEventQuery = database
        .getRepository(Event)
        .createQueryBuilder('event')
        .where('event.date >= :dateMin', { dateMin: new Date().toISOString() })
        .andWhere('event.sellingOpen = :sellingOpen', { sellingOpen: false })
        .orderBy('date', 'ASC');

    const upcomingEvent = await upcomingEventQuery.getOne().catch(logErrorReturnNull);

    if (upcomingEvent) {
        logger.info(`Found event which is not yet open: ${upcomingEvent.id}`);
        return res.json(upcomingEvent);
    }

    const soldOutEventQuery = database
        .getRepository(Event)
        .createQueryBuilder('event')
        .where('event.date >= :dateMin', { dateMin: new Date().toISOString() })
        .andWhere('event.soldOut = :soldOut', { soldOut: true })
        .orderBy('date', 'ASC');

    const soldOutEvent = await soldOutEventQuery.getOne().catch(logErrorReturnNull);

    if (soldOutEvent) {
        logger.info(`Found sould out event event: ${soldOutEvent.id}`);
        return res.json(soldOutEvent);
    }

    return res.status(404).json({ message: 'No upcoming events' });
}

// ---------------------
// GET /events/gallery
// ---------------------

async function getEventGalleryHandler(req: Request, res: Response) {
    const openEventQuery = database
        .getRepository(Event)
        .createQueryBuilder('event')
        .where('event.date <= :dateMax', { dateMax: new Date().toISOString() })
        .andWhere('event.galleryEnabled = :galleryEnabled', { galleryEnabled: true })
        .orderBy('date', 'DESC');

    const openEvent = await openEventQuery.getMany().catch(logErrorReturnNull);

    if (!openEvent) {
        return res.status(500).json({ message: 'Error' });
    }

    logger.info(`Found ${openEvent.length} events with gallery enabled`);
    return res.json(openEvent);
}

// ----------------
// GET /events/:id
// ----------------
async function getEventHandler(req: Request, res: Response) {
    const parsedId = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }

    const id = parsedId.data;
    const event = await getEvent({ id }).catch(logErrorReturnNull);
    if (!event) {
        return res.status(404).json({ message: `Event "${id}" not found` });
    }

    return res.json(event);
}

// ----------------
// POST /events
// ----------------

const ticketTypeSchema = z.object({
    name: z.string().min(1),
    price: z.number().int().positive(),
    capacity: z.number().int().positive(),
    details: z.array(z.string()).min(1).max(5),
});

const createEventSchema = z.object({
    name: z.string().min(1),
    date: z.string().datetime(),
    description: z.string().min(1),
    address: z.string().min(1),
    sellingOpen: z.boolean(),
    galleryEnabled: z.boolean(),
    ticketTypes: z.array(ticketTypeSchema).min(1),
});

async function postEventHandler(req: Request, res: Response) {
    const parsedData = createEventSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }

    const ticketTypes = parsedData.data.ticketTypes.map((ticketType) => {
        return { ...ticketType, soldOut: false };
    });

    const event = {
        ...parsedData.data,
        date: new Date(parsedData.data.date),
        ticketTypes: ticketTypes,
    };

    const result = await createEvent(event).catch(logErrorReturnNull);
    if (!result) {
        return res.status(500).json({ message: 'Failed to create event' });
    }

    return res.json(result);
}

// ----------------
// PATCH /events/:id
// ----------------
const updateEventSchema = z
    .object({
        name: z.string().min(1),
        date: z.string().datetime(),
        description: z.string().min(1),
        address: z.string().min(1),
        sellingOpen: z.boolean(),
        galleryEnabled: z.boolean(),
        ticketTypes: z.array(ticketTypeSchema).min(1),
    })
    .partial()
    .refine((data) => {
        return Object.values(data).some((v) => {
            return v !== undefined;
        });
    });

async function patchEventHandler(req: Request, res: Response) {
    const parsedId = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }

    const id = parsedId.data;

    const parsedData = updateEventSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: formatZodError(parsedData.error) });
    }

    const event = await getEvent({ id }).catch(logErrorReturnNull);
    if (!event) {
        return res.status(404).json({ message: `Event "${id}" not found` });
    }

    event.name = parsedData.data.name ?? event.name;
    event.date = parsedData.data.date ? new Date(parsedData.data.date) : event.date;
    event.description = parsedData.data.description ?? event.description;
    event.address = parsedData.data.address ?? event.address;

    if (parsedData.data.sellingOpen !== undefined) {
        event.sellingOpen = parsedData.data.sellingOpen;
    }

    if (parsedData.data.galleryEnabled !== undefined) {
        event.galleryEnabled = parsedData.data.galleryEnabled;
    }

    if (parsedData.data.ticketTypes) {
        const ticketTypes = parsedData.data.ticketTypes.map((ticketType) => {
            return { ...ticketType, soldOut: false };
        });
        event.ticketTypes = ticketTypes;
    }

    const newEvent = await updateEvent(event).catch(logErrorReturnNull);
    if (!newEvent) {
        return res.status(500).json({ message: 'Failed to update event' });
    }

    logger.info(`Event "${id}" updated`);
    logger.info(newEvent);
    return res.json(newEvent);
}

// ----------------
// DELETE /events/:id
// ----------------
async function deleteEventHandler(req: Request, res: Response) {
    const parsedId = z.coerce.number().int().positive().safeParse(req.params.id);
    if (!parsedId.success) {
        return res.status(400).json({ message: formatZodError(parsedId.error) });
    }

    const id = parsedId.data;
    const result = await deleteEvent(id).catch(logErrorReturnNull);
    if (!result || !result.affected) {
        return res.status(404).json({ message: `Event "${id}" not found` });
    }

    logger.info(`Event "${id}" deleted`);
    return res.sendStatus(200);
}
