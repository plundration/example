import { setSeederFactory } from 'typeorm-extension';
import { Ticket } from '@/database/entities/ticket.entity';

export default setSeederFactory(Ticket, (faker) => {
    const ticket = new Ticket();

    if (faker.number.int({ max: 3 }) > 2) {
        ticket.scannedAt = new Date();
    }

    return ticket;
});
