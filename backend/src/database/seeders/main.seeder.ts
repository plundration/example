import { faker } from '@faker-js/faker';

import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { Ticket } from '@/database/entities/ticket.entity';
import { Event } from '@/database/entities/event.entity';
import { Transaction } from '@/database/entities/transaction.entity';
import { Promo } from '@/database/entities/promo.entity';

function pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTicket(event: Event) {
    const ticketType = pickRandom(event.ticketTypes);
    return {
        event,
        ticketTypeName: ticketType.name,
        price: ticketType.price,
    };
}

export default class MainSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
        const eventFactory = factoryManager.get(Event);
        const ticketFactory = factoryManager.get(Ticket);
        const transactionFactory = factoryManager.get(Transaction);
        const promoFactory = factoryManager.get(Promo);

        const newestEvent = await eventFactory.save({
            id: 1,
            name: 'Newest Event',
            date: new Date(Date.now() + 1000 * 60 * 60),
            description:
                'This event is going to be the bomb, there are going to be so many people, you will have a great time!',
            address: '123 Fake St',
            sellingOpen: true,
            galleryEnabled: false,
            ticketTypes: [
                {
                    name: 'Basic',
                    price: 1000,
                    capacity: 100,
                    soldOut: false,
                    details: ['Wow so good', 'You can stand around', 'You can dance'],
                },
            ],
        });

        await eventFactory.save({
            id: 2,
            name: 'Old Event',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            description:
                'This event is going to be the bomb, there are going to be so many people, you will have a great time!',
            address: '123 Fake St',
            sellingOpen: false,
            galleryEnabled: true,
            ticketTypes: [
                {
                    name: 'Basic',
                    price: 1000,
                    capacity: 100,
                    soldOut: false,
                    details: ['Wow so good', 'You can stand around', 'You can dance'],
                },
            ],
        });

        const promo = await promoFactory.save({
            code: 'PROMO',
            discountPercent: 20,
            event: newestEvent,
        });

        await transactionFactory.save({
            price: 1000,
            tickets: [
                await ticketFactory.save({
                    event: newestEvent,
                    ticketTypeName: 'Basic',
                    price: 1000,
                }),
            ],
            promo,
            email: 'a@gmail.com',
            firstName: 'A',
            lastName: 'A',
            gopayId: 1,
        });

        const events = await eventFactory.saveMany(8);

        for (let i = 0; i < 8; i++) {
            const tickets = [];
            for (let j = 0; j < randomInt(1, 3); j++) {
                tickets.push(await ticketFactory.save(randomTicket(pickRandom(events))));
            }
            const price = tickets.reduce((acc, ticket) => acc + ticket.price, 0);
            await transactionFactory.save({ price, tickets });
        }

        for (let i = 0; i < 10; i++) {
            const event = pickRandom(events);
            const ticket = await ticketFactory.save(randomTicket(event));
            await transactionFactory.save({
                price: ticket.price,
                tickets: [ticket],
            });
        }
    }
}
