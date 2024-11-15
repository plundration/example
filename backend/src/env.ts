import dotenv from 'dotenv';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const file = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: file });
