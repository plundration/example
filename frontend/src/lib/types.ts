export interface Ticket {
	id: string;
	event: Event;
	eventId: number;
	ticketTypeName: string;
	price: number;
	userId: string;
	transactionId: number;
	scannedAt: Date | null;
	createdAt: Date;
}

export interface TicketType {
	name: string;
	price: number;
	capacity: number;
	soldOut: boolean;
	details: string[];
}

export interface Event {
	id: number;
	name: string;
	date: Date;
	description: string;
	address: string;
	sellingOpen: boolean;
	soldOut: boolean;
	galleryEnabled: boolean;
	ticketTypes: TicketType[];
}

export interface Transaction {
	id: string;
	gopayId: number;
	email: string;
	firstName: string;
	lastName: string;
	price: number;
	state: GopayState;
	sent: boolean;
	tickets: Ticket[];
	createdAt: Date;
}

const GopayStateArray = [
	'CREATED',
	'PAYMENT_METHOD_CHOSEN',
	'TIMEOUTED',
	'PAID',
	'CANCELED',
	'AUTHORIZED',
	'PARTIALLY_REFUNDED',
	'REFUNDED'
];

export type GopayState = (typeof GopayStateArray)[number];
