import express from 'express';
import cors from 'cors';

import eventsRouter from '@/routes/events';
import promosRouter from '@/routes/promos';
import ticketsRouter from '@/routes/tickets';
import transactionRouter from '@/routes/transactions';
import adminRouter from '@/routes/admin';
import gopayNotificationRouter from '@/routes/gopay_notification';
import imageRouter from '@/routes/images';

import {
    logResponseErrorMiddleware,
    morganRequestMiddleware,
    morganResponseMiddleware,
} from '@/services/logger';

import { verifyIdToken, loadUserDataMiddleware } from '@/services/firebase';

export function initExpressApp() {
    const app = express();

    app.use(morganRequestMiddleware);
    app.use(morganResponseMiddleware);
    app.use(logResponseErrorMiddleware);

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(loadUserDataMiddleware);

    app.use('/events', eventsRouter);
    app.use('/promos', promosRouter);
    app.use('/tickets', ticketsRouter);
    app.use('/transactions', transactionRouter);
    app.use('/gopay_notification', gopayNotificationRouter);
    app.use('/admin', adminRouter);
    app.use('/images', imageRouter);

    return app;
}
