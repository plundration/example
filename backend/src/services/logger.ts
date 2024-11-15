import winston from 'winston';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// import { LoggingWinston } from '@google-cloud/logging-winston';
// const loggingWinston = new LoggingWinston();

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        cron: 2,
        http: 3,
        info: 4,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        cron: 'blue',
        http: 'magenta',
        info: 'green',
    },
};

// Add colors to winston
winston.addColors(customLevels.colors);

// Create a Winston logger that streams to Cloud Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/winston_log"
export const logger = winston.createLogger({
    level: 'info',
    levels: customLevels.levels,
    format:
        process.env.NODE_ENV !== 'production'
            ? winston.format.combine(
                  winston.format.colorize(),
                  winston.format.simple(),
                  winston.format.errors(),
              )
            : winston.format.combine(winston.format.json(), winston.format.errors({ stack: true })),
    transports: [
        new winston.transports.Console({}),
        // TODO: Add Cloud Logging
        // loggingWinston,
    ],
});

export const morganRequestMiddleware = morgan(':method :url', {
    immediate: true,
    stream: {
        write: (message: string) => logger.http(message.trim()),
    },
});

export const morganResponseMiddleware = morgan(
    ':method :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message: string) => logger.http(message.trim()),
            // TODO: Uncomment the line below to log HTTP requests with the "http" severity level
            // write: (message: string) => logger.http(message.trim()),
        },
    },
);

export const logResponseErrorMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (res.statusCode >= 400) {
            logger.error(body.message);
            logger.error(formatBody(req.body));
        }
        return originalJson.call(this, body);
    };

    next();
};

export function logErrorReturnNull(error: any) {
    if (error.message) {
        logger.error(error.message);
    }
    logger.error(JSON.stringify(error, null, 2));
    return null;
}

export function formatZodError(error: ZodError) {
    return error.errors
        .map((err) => {
            return `${err.path.join('.')}: ${err.message}`;
        })
        .join(', ');
}

export function formatBody(body: any) {
    return process.env.NODE_ENV !== 'production'
        ? JSON.stringify(body, null, 2)
        : JSON.stringify(body);
}

export default logger;
