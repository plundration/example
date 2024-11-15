import { FindOptionsWhere } from 'typeorm';

import database from '@/database/database';
import {
    Transaction,
    TransactionCreate,
    TransactionUpdate,
} from '@/database/entities/transaction.entity';
import { Ticket } from '@/database/entities/ticket.entity';

export async function listTransactions(
    where: FindOptionsWhere<Transaction> | undefined = undefined,
) {
    const transactionRepository = database.getRepository(Transaction);
    return await transactionRepository.find({ where, relations: ['tickets'] });
}

export async function getTransaction(where: FindOptionsWhere<Transaction>) {
    const transactionRepository = database.getRepository(Transaction);
    return await transactionRepository.findOne({ where, relations: ['tickets'] });
}

export async function deleteTransaction(id: string) {
    database.getRepository(Ticket).delete({ transaction: { id } });
    return await database.getRepository(Transaction).delete({ id });
}

export async function createTransaction(transaction: TransactionCreate) {
    const transactionRepository = database.getRepository(Transaction);
    return await transactionRepository.save(transaction);
}

export async function updateTransaction(transaction: TransactionUpdate) {
    const transactionRepository = database.getRepository(Transaction);
    const exists = await transactionRepository.existsBy({ id: transaction.id });
    if (!exists) {
        throw new Error(`Transaction with id "${transaction.id}" does not exist`);
    }
    return await transactionRepository.save(transaction);
}
