import { z } from 'zod';

export const formSchema = z
	.object({
		email: z.string().email(),
		confirmEmail: z.string().email(),
		firstName: z.string().min(1),
		lastName: z.string().min(1),
		eventId: z.number().int().positive(),
		ticketTypeName: z.string().min(1),
		ticketAmount: z.number().int().positive().min(1).max(6),
		newsletter: z.boolean(),
		promoCode: z.string()
	})
	.refine((data) => data.email === data.confirmEmail, {
		path: ['confirmEmail'],
		message: 'Emails do not match'
	});

export type FormSchema = typeof formSchema;
