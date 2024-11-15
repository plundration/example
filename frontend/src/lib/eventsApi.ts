import { env } from '$env/dynamic/public';
import type { Event } from './types';

export async function getUpcomingEvent() {
	const url = `${env.PUBLIC_API_URL}/events/upcoming`;
	const res = await fetch(url);

	if (!res.ok) {
		return null;
	}

	const data = await res.json();
	return data as Event;
}
