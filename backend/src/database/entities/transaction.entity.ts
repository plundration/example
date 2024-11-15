import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
    ManyToOne,
    RelationId,
} from 'typeorm';
import { Ticket } from '@/database/entities/ticket.entity';
import { Promo } from '@/database/entities/promo.entity';

// export enum GopayState {
//     CREATED = 'CREATED',
//     PAYMENT_METHOD_CHOSEN = 'PAYMENT_METHOD_CHOSEN',
//     TIMEOUTED = 'TIMEOUTED',
//     PAID = 'PAID',
//     CANCELED = 'CANCELED',
//     AUTHORIZED = 'AUTHORIZED',
//     PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
//     REFUNDED = 'REFUNDED',
// }

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

export type GopayState = (typeof GopayStateArray)[number];

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

export type TransactionCreate = Omit<
    Transaction,
    'id' | 'gopayId' | 'state' | 'sent' | 'createdAt'
>;
export type TransactionUpdate = Partial<Transaction> & { id: string };
