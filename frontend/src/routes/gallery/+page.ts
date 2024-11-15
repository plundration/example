import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Event } from '$lib/types';
import { env } from '$env/dynamic/public';

export const load: PageLoad = async ({ params, fetch }) => {
	const url = `${env.PUBLIC_API_URL}/events/gallery`;
	const res = await fetch(url);
	const data = await res.json().catch();

	if (!res.ok) {
		error(res.status, { message: data.message ?? 'Error' });
	}

	return { events: data as Event[] };
};
