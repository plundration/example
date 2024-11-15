# Entities

## Event

```typescript
export class TicketType {
    @Column()
    name!: string;

    @Column({ type: 'integer' })
    price!: number;

    @Column({ type: 'integer' })
    capacity!: number;

    @Column({ type: 'boolean', default: false })
    soldOut!: boolean;

    @Column('json')
    details!: string[];
}

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ type: 'timestamp' })
    date!: Date;

    @Column()
    description!: string;

    @Column()
    address!: string;

    @Column('json')
    ticketTypes!: TicketType[];

    @Column({ type: 'boolean', default: false })
    sellingOpen!: boolean;

    @Column({ type: 'boolean', default: false })
    soldOut!: boolean;

    @Column({ type: 'boolean', default: false })
    galleryEnabled!: boolean;

    @OneToMany(() => Ticket, (ticket) => ticket.event, { nullable: true })
    tickets!: Ticket[];

    @OneToMany(() => Promo, (promo) => promo.event, { nullable: true })
    promos!: Promo[];
}
```

## Ticket

```typescript
@Entity()
export class Ticket {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'CASCADE' })
    event!: Event;

    @RelationId((ticket: Ticket) => ticket.event)
    eventId!: number;

    @Column()
    ticketTypeName!: string;

    @Column({ type: 'integer' })
    price!: number;

    @ManyToOne(() => Transaction, (transaction) => transaction.tickets, { onDelete: 'CASCADE' })
    transaction!: Transaction;

    @RelationId((ticket: Ticket) => ticket.transaction)
    transactionId!: number;

    @Column({ type: 'timestamp', nullable: true, default: null })
    scannedAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;
}
```

### Transaction

```typescript
export const GopayStateArray = [
    'CREATED',
    'PAYMENT_METHOD_CHOSEN',
    'TIMEOUTED',
    'PAID',
    'CANCELED',
    'AUTHORIZED',
    'PARTIALLY_REFUNDED',
    'REFUNDED',
] as const;

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'bigint', nullable: true, default: null })
    gopayId!: number | null;

    @Column()
    email!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ type: 'integer' })
    price!: number;

    @Column({ type: 'enum', enum: GopayStateArray, default: 'CREATED' })
    state!: GopayState;

    @Column({ default: false })
    sent!: boolean;

    @OneToMany(() => Ticket, (ticket) => ticket.transaction, { nullable: true })
    tickets!: Ticket[];

    @ManyToOne(() => Promo, (promo) => promo.transactions, { onDelete: 'SET NULL', nullable: true })
    promo!: Promo | null;

    @RelationId((transaction: Transaction) => transaction.promo)
    promoId!: number | null;

    @CreateDateColumn()
    createdAt!: Date;
}
```

### Promo

```typescript
@Entity()
export class Promo {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    code!: string;

    @Column({ type: 'integer' })
    discountPercent!: number;

    @ManyToOne(() => Event, (event) => event.promos, { onDelete: 'CASCADE' })
    event!: Event;

    @RelationId((promo: Promo) => promo.event)
    eventId!: number;

    @OneToMany(() => Transaction, (transaction) => transaction.promo, {
        nullable: true,
    })
    transactions!: Transaction[];

    @Column({ type: 'boolean', default: true })
    enabled!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
```

# Testing

## GoPay

**Card number**: 5447380000000006
**Expiration**: any future date
**CVV**: any 3 digits

# API

The API docs are available via Bruno in the Bruno folder.
