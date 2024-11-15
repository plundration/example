import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Event } from '$lib/types';
import { env } from '$env/dynamic/public';

export const load: PageLoad = async ({ params, fetch }) => {
	let event = null;

	{
		const url = `${env.PUBLIC_API_URL}/events/${params.id}`;
		const res = await fetch(url);

		if (!res.ok) {
			error(res.status, { message: `Error` });
		}

		const data = (await res.json()) as Event;
		event = data;
	}

	if (!event.galleryEnabled) {
		error(404, { message: `Not found` });
	}

	// const url = `http://localhost/api/images/${params.id}/list`;
	const url = new URL(`${env.PUBLIC_API_URL}/images/1/list`); // TODO
	const res = await fetch(url);

	if (!res.ok) {
		error(res.status, { message: `Error` });
	}

	const data = await res.json();

	if (!data.images || !data.images.length) {
		error(404, { message: `Not found` });
	}

	return { images: data.images, event };
};
