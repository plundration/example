import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    RelationId,
    OneToMany,
} from 'typeorm';

import { Event } from '@/database/entities/event.entity';
import { Transaction } from '@/database/entities/transaction.entity';

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

export type PromoCreate = Omit<Promo, 'id' | 'createdAt'>;
export type PromoUpdate = Partial<Promo> & { id: string };
