import { DataSource } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';
// import { DataSourceOptions } from 'typeorm/browser';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

import logger from '@/services/logger';

// For the typeorm CLI to work
import '@/env';

const options: PostgresConnectionOptions & SeederOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || ''),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    synchronize: false,
    logging: false,

    entities: ['src/database/entities/*.entity.ts'],
    migrations: ['migrations/*.ts'],
    subscribers: [],

    factories: ['src/database/factories/*.factory.ts'],
    seeds: ['src/database/seeders/*.seeder.ts'],
};

const database = new DataSource(options);

async function clearDatabase() {
    logger.info('Clearing database');

    for (const entity of database.entityMetadatas) {
        await database.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
        logger.info(`Cleared table ${entity.name}`);
    }

    logger.info('Cleared database');
}

async function seedDatabase() {
    logger.info('Seeding database');
    await runSeeders(database);
    logger.info('Seeded database successfully');
}

export async function initDatabase() {
    await database.initialize();

    // TODO: check database for transactions every startup
    // cleanup, send unsent tickets, etc.

    logger.info('Connected to database');

    if (process.env.NODE_ENV === 'development') {
        await clearDatabase();
        await seedDatabase();
    }
}

export default database;
