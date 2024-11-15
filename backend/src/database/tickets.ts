import { FindOptionsWhere } from 'typeorm';

import database from '@/database/database';
import { Event } from '@/database/entities/event.entity';
import { Ticket, TicketUpdate } from '@/database/entities/ticket.entity';
import logger from '@/services/logger';
import { Promo } from '@/database/entities/promo.entity';

export async function listTickets(where: FindOptionsWhere<Ticket> | undefined = undefined) {
    const ticketRepository = database.getRepository(Ticket);
    return await ticketRepository.find({ where, relations: { event: true } });
}

export async function getTicket(where: FindOptionsWhere<Ticket>) {
    const ticketRepository = database.getRepository(Ticket);
    return await ticketRepository.findOne({ where, relations: { event: true } });
}

export async function createTicket(eventId: number, ticketTypeName: string) {
    const eventRepository = database.getRepository(Event);
    const ticketRepository = database.getRepository(Ticket);

    const event = await eventRepository.findOneBy({ id: eventId });

    if (!event) {
        throw new Error(`Event "${eventId}" not found`);
    }

    const ticketType = event.ticketTypes.find((type) => type.name === ticketTypeName);
    if (ticketType === undefined) {
        throw new Error(`Ticket type "${ticketTypeName}" not found for event "${eventId}"`);
    }

    return await ticketRepository.save({
        eventId: event.id,
        ticketTypeName,
        price: ticketType.price,
    });
}

export async function createTicketsOrFail(
    eventId: number,
    ticketTypeName: string,
    newTicketCount: number,
    promo: Promo | null,
) {
    const eventRepository = database.getRepository(Event);
    const ticketRepository = database.getRepository(Ticket);

    const event = await eventRepository.findOneBy({ id: eventId });

    if (!event) {
        throw new Error(`Event "${eventId}" not found`);
    }

    if (event.date < new Date()) {
        throw new Error(`Event "${eventId}" is in the past`);
    }

    if (!event.sellingOpen) {
        throw new Error(`Event "${eventId}" is not selling tickets yet`);
    }

    if (event.soldOut) {
        throw new Error(`Event "${eventId}" is sold out`);
    }

    const ticketType = event.ticketTypes.find((type) => type.name === ticketTypeName);
    if (ticketType === undefined) {
        throw new Error(`Ticket type "${ticketTypeName}" not found for event "${eventId}"`);
    }

    const existingTicketCount = await ticketRepository.count({
        where: { event: { id: eventId }, ticketTypeName: ticketTypeName },
    });

    if (existingTicketCount + newTicketCount > ticketType.capacity) {
        ticketType.soldOut = true;
        if (event.ticketTypes.every((t) => t.soldOut)) {
            event.soldOut = true;
        }
        await eventRepository.save(event).catch((error) => {
            logger.error(error);
            throw new Error(`Failed to update event "${eventId}"`);
        });
        throw new Error(`Event "${eventId}" is sold out`);
    }

    logger.info(`Creating ${newTicketCount} ${ticketTypeName} tickets for event "${eventId}"`);

    const tickets: Ticket[] = [];
    const price = promo ? ticketType.price * (1 - promo.discountPercent / 100) : ticketType.price;

    for (let i = 0; i < newTicketCount; i++) {
        tickets.push(
            await ticketRepository.save({
                event,
                ticketTypeName,
                price,
            }),
        );
    }

    return tickets;
}

export async function updateTicketScannedAt(id: string, scanned: boolean) {
    const ticketRepository = database.getRepository(Ticket);
    const ticket = await ticketRepository.findOneBy({ id });

    if (!ticket) throw new Error(`Ticket "${id}" not found`);

    ticket.scannedAt = scanned ? new Date() : null;
    return await ticketRepository.save(ticket);
}

export async function updateTicket(ticket: TicketUpdate) {
    const ticketRepository = database.getRepository(Ticket);
    const exists = await ticketRepository.existsBy({ id: ticket.id });
    if (!exists) {
        throw new Error(`ticket with id "${ticket.id}" does not exist`);
    }

    return await ticketRepository.save(ticket);
}

export async function deleteTicket(id: string) {
    return await database.getRepository(Ticket).delete({ id });
}
