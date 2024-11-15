import { setSeederFactory } from 'typeorm-extension';
import { Transaction } from '@/database/entities/transaction.entity';

export default setSeederFactory(Transaction, (faker) => {
    const transaction = new Transaction();
    transaction.gopayId = faker.number.int(99999999);
    transaction.email = faker.internet.email();
    transaction.firstName = faker.person.firstName();
    transaction.lastName = faker.person.lastName();
    // price
    transaction.state = ['CREATED', 'PAID'][faker.number.int(1)] as 'CREATED' | 'PAID';
    transaction.sent = transaction.state === 'PAID' ? Boolean(faker.number.int(1)) : false;
    // tickets
    return transaction;
});
