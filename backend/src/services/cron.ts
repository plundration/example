import cron from 'node-cron';

import logger from '@/services/logger';
import { sendTickets } from '@/services/email';
import { deleteTransaction, listTransactions, updateTransaction } from '@/database/transactions';
import { deleteTicket } from '@/database/tickets';

async function sendUnsentPaidTickets() {
    logger.info('Fetching tickets to send');
    const transactions = await listTransactions({ state: 'PAID', sent: false });

    if (transactions.length === 0) {
        logger.info('No unsent paid tickets');
        return;
    }

    logger.info(`Sending tickets for ${transactions.length} transactions`);

    for (const transaction of transactions) {
        if (transaction.tickets.length === 0) {
            logger.error(`Transaction ${transaction.id} has no tickets`);
            transaction.sent = true;
            await updateTransaction(transaction).catch((error) => {
                logger.error(`Error updating broken transaction ${transaction.id}`);
                logger.error(error);
            });
        }
        await sendTickets(transaction.tickets, transaction.email)
            .then(() => {
                logger.info(`Tickets sent for transaction ${transaction.id}`);
                transaction.sent = true;
                updateTransaction(transaction).catch((error) => {
                    logger.error(`Error updating transaction ${transaction.id}`);
                    logger.error(error);
                });
            })
            .catch((error) => {
                logger.error(`Error sending tickets for transaction ${transaction.id}`);
                logger.error(error);
            });
    }
}

async function deleteCanceledTransactionTickets() {
    logger.info('Fetching transactions to delete');
    const transactions = await listTransactions({ state: 'CANCELED' });

    for (const transaction of transactions) {
        logger.info(`Deleting tickets for canceled transaction ${transaction.id}`);

        if (transaction.tickets.length === 0) {
            logger.error(`Transaction ${transaction.id} has no tickets`);
            if (transaction.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
                await deleteTransaction(transaction.id)
                    .then(() => {
                        logger.info(`Deleted transaction ${transaction.id}`);
                    })
                    .catch((error) => {
                        logger.error(`Error deleting broken transaction ${transaction.id}`);
                        logger.error(error);
                    });
            }
        }

        for (const ticket of transaction.tickets) {
            await deleteTicket(ticket.id)
                .then(() => {
                    logger.info(`Deleted ticket ${ticket.id}`);
                })
                .catch((error) => {
                    logger.error(`Error deleting ticket ${ticket.id}`);
                    logger.error(error);
                });
        }
    }
}

export function initCronJobs() {
    logger.info('Initializing cron jobs');

    cron.schedule('* * * * *', async () => {
        logger.log('cron', 'Sending unsetnt paid tickets');
        await sendUnsentPaidTickets()
            .then(() => {
                logger.log('cron', 'Done sending tickets');
            })
            .catch((error) => {
                logger.error('Error sending unsent paid tickets');
                logger.error(error);
            });

        logger.log('cron', 'Deleting canceled transaction tickets');
        await deleteCanceledTransactionTickets()
            .then(() => {
                logger.log('cron', 'Done deleting canceled transaction tickets');
            })
            .catch((error) => {
                logger.error('Error deleting canceled transaction tickets');
                logger.error(error);
            });
    });

    cron.schedule('* * * * *', () => {});

    logger.info('Cron jobs initialized');
}
