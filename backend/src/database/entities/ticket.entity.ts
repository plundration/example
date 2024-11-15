import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    RelationId,
} from 'typeorm';

import { Event } from '@/database/entities/event.entity';
import { Transaction } from '@/database/entities/transaction.entity';

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

    @ManyToOne(() => Transaction, (transaction) => transaction.tickets, {
        onDelete: 'CASCADE',
    })
    transaction!: Transaction;

    @RelationId((ticket: Ticket) => ticket.transaction)
    transactionId!: number;

    @Column({ type: 'timestamp', nullable: true, default: null })
    scannedAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;
}

export type TicketUpdate = Partial<Ticket> & { id: string };
