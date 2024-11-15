import '@/env';

import 'reflect-metadata';

import { exit } from 'process';

import http from 'http';

import { logger } from '@/services/logger';

import { initDatabase } from '@/database/database';
import { initPaymentSystem } from '@/services/gopay';
import { initCronJobs } from '@/services/cron';
import { initExpressApp } from '@/app';

(async () => {
    await initDatabase().catch((error) => {
        logger.error(`Database error: ${error}`);
        exit(1);
    });

    await initPaymentSystem().catch((error) => {
        logger.error(`Payment system error: ${error}`);
        exit(1);
    });

    initCronJobs();

    const app = initExpressApp();
    const port = process.env.PORT || 4000;

    const server = http.createServer(app);
    server.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
    });
})();
