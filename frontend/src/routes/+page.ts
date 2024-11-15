import type { PageLoad } from './$types';
import { getUpcomingEvent } from '$lib/eventsApi';

export const load: PageLoad = async () => {
	const event = await getUpcomingEvent();
	return { event };
};
