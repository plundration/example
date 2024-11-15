import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Ticket } from '@/database/entities/ticket.entity';
import { Promo } from '@/database/entities/promo.entity';

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

    @OneToMany(() => Ticket, (ticket) => ticket.event, {
        nullable: true,
    })
    tickets!: Ticket[];

    @OneToMany(() => Promo, (promo) => promo.event, {
        nullable: true,
    })
    promos!: Promo[];
}

export type EventCreate = Omit<Event, 'id' | 'soldOut' | 'tickets' | 'galleryEnabled' | 'promos'>;
export type EventUpdate = Partial<Event> & { id: number };
