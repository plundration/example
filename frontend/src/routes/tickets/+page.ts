import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getUpcomingEvent } from '$lib/eventsApi';

export const load: PageLoad = async ({ params, fetch }) => {
	const event = await getUpcomingEvent();
	if (!event) {
		error(404, { message: 'No upcoming event' });
	}
	return { event };
};
