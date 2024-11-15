# **redacted** Backend

Backend pre **redacted**

Robený pomocou:

- Node.js
- Express.js
- TypeORM

## Ako spustiť

Nainštalujte dependencies:

```sh
npm install
```

Spustite:

```sh
# Development
npm run dev
# Production
npm run build && npm run start
```

### Databáza

Databáza je Postgres bežiaci cez `docker`. Na spustenie:

```sh
sudo docker-compose up -f db/docker-compose.yml
```

## Testovanie

### Seedovanie

**Factories** a **seeders** sú uložené v `src/database/entities/factories` a `src/database/entities/seeders`.

Používajú `faker.js` na tvorbu dát.

Seeding prebieha na začiatku spustenia servera (db sa clearne a seedne).

## Iné príkazy

```sh
npm run typeorm # npx typeorm-ts-node-commonjs
npm run schema:sync # Syncne databázu s entitami
npm run schema:drop # Dropne všetko v db
npm run migrations:clear # Fake revertne migrácie, vymaže ich a potom syncne db
npm run migrations:generate # Tvorí nové migrácie
npm run migrations:run # Beží všetky migrácie
```
