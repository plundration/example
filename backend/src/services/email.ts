import nodemailer from 'nodemailer';
import fs from 'fs';

import { Ticket } from '@/database/entities/ticket.entity';
import { Event } from '@/database/entities/event.entity';
import database from '@/database/database';

import logger from '@/services/logger';

const transporter = nodemailer.createTransport({
    host: 'smtp.m1.websupport.sk',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const template = fs.readFileSync(__dirname + '/emailTemplate.html', 'utf-8');

export async function sendTickets(tickets: Ticket[], email: string) {
    if (tickets.length === 0) {
        throw new Error('No tickets to send');
    }

    for (const ticket of tickets) {
        await sendTicket(ticket, email, tickets.length);
    }
}

async function sendTicket(ticket: Ticket, email: string, amount: number) {
    const eventRepository = database.getRepository(Event);

    const event = await eventRepository.findOneBy({ id: ticket.eventId });

    if (!event) {
        throw new Error(`Event "${ticket.eventId}" not found`);
    }

    let emailHtml = template
        .replace('[name]', event.name)
        .replace('[date]', event.date.toLocaleDateString())
        .replace('[time]', event.date.toLocaleTimeString())
        .replace('[location]', event.address)
        .replace('[ticketTypeName]', ticket.ticketTypeName)
        .replace('[quantity]', amount.toString())
        .replace('[totalPrice]', (ticket.price * amount) / 100 + '€')
        .replace('[description]', event.description);

    const qrCode = await generateQRCode(ticket.id);
    emailHtml = emailHtml.replace('[qrCode]', qrCode);

    const mailOptions = {
        from: 'redacted@jn-solutions.tech',
        to: email,
        subject: 'Your redacted Tickets',
        html: emailHtml,
    };

    // FIXME
    if (process.env.NODE_ENV !== 'production') {
        logger.info('Email sent');
        return;
    }

    await transporter.sendMail(mailOptions);
}

async function generateQRCode(ticketId: string): Promise<string> {
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketId}`;
    return qrCode;
}
