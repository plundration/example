import database from '@/database/database';
import { Event, EventCreate, EventUpdate } from '@/database/entities/event.entity';
import { FindOptionsWhere } from 'typeorm';
import { Ticket } from '@/database/entities/ticket.entity';

export async function listEvents(where: FindOptionsWhere<Event> | undefined = undefined) {
    const eventRepository = database.getRepository(Event);
    return await eventRepository.find({ where });
}

export async function getEvent(where: FindOptionsWhere<Event>) {
    const eventRepository = database.getRepository(Event);
    return await eventRepository.findOne({ where });
}

export async function createEvent(event: EventCreate) {
    const eventRepository = database.getRepository(Event);
    return await eventRepository.save(event);
}

export async function updateEvent(event: EventUpdate) {
    const eventRepository = database.getRepository(Event);
    const exists = await eventRepository.existsBy({ id: event.id });
    if (!exists) {
        throw new Error(`Event with id "${event.id}" does not exist`);
    }

    return await eventRepository.save(event);
}

export async function deleteEvent(id: number) {
    database.getRepository(Ticket).delete({ event: { id } });
    return await database.getRepository(Event).delete({ id });
}
