import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { env } from '$env/dynamic/public';

import type { Transaction } from '$lib/types';

export const load: PageLoad = async ({ params, url, fetch }) => {
	const id = params.id;
	const gopayId = url.searchParams.get('id');

	if (!id) {
		error(400, { message: 'Missing "id"' });
	}

	const apiUrl = new URL(`${env.PUBLIC_API_URL}/transactions/status`);
	apiUrl.search = new URLSearchParams({
		id: id,
		gopayId: gopayId
	}).toString();

	const res = await fetch(apiUrl);

	if (!res.ok) {
		error(res.status, { message: 'Failed to fetch transaction' });
	}

	const data = await res.json();
	return { transaction: data as Transaction };
};
