/* eslint-disable prettier/prettier */
import { setSeederFactory } from 'typeorm-extension';
import { Event } from '@/database/entities/event.entity';

export default setSeederFactory(Event, (faker) => {
    const event = new Event();
    event.name = faker.word.verb() + ' ' + faker.word.noun();
    event.name = event.name.charAt(0).toUpperCase() + event.name.slice(1);
    event.description = faker.lorem.paragraph(4);
    event.address = faker.location.streetAddress(true);
    event.date = faker.date.soon({ days: 30 });
    event.sellingOpen = faker.number.int({ max: 1 }) === 1;
    event.galleryEnabled = faker.number.int({ max: 1 }) === 1;
    const ticketTypes = [
        {
            name: 'Basic',
            price: faker.number.int({ min: 10, max: 20 }) * 100,
            capacity: faker.number.int({ min: 75, max: 200 }),
            soldOut: false,
            details: ['Wow so good', 'You can stand around', 'You can dance'],
        },
    ];

    if (faker.number.int({ max: 1 })) {
        ticketTypes.push({
            name: 'VIP',
            price: faker.number.int({ min: 20, max: 50 }) * 100,
            capacity: faker.number.int({ min: 5, max: 20 }),
            soldOut: false,
            details: ['Even better', 'You can stand around', 'You can dance'],
        });

        if (faker.number.int({ max: 1 })) {
            ticketTypes.push({
                name: 'Elite',
                price: faker.number.int({ min: 75, max: 100 }) * 100,
                capacity: faker.number.int({ min: 1, max: 5 }),
                soldOut: false,
                details: ['SO GREAT', 'You can stand around', 'You can dance'],
            });
        }
    }

    event.ticketTypes = ticketTypes;

    return event;
});
