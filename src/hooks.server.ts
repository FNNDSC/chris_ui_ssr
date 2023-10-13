import type { Handle } from '@sveltejs/kit';
import { fetchClient } from '$lib/client';

export const handle: Handle = async ({ resolve, event }) => {
	// get cookies from browser
	const session = event.cookies.get('session');
	const url = event.cookies.get('cubeurl');

	if (!session) {
		// if there is no session load page as normal
		return await resolve(event);
	}

	const client = fetchClient(session, url);
	const user = await (await client.getUser()).data;

	// if `user` exists set `events.local`
	if (user) {
		event.locals.user = {
			name: user.username,
			token: session,
			cubeurl: url
		};
	}

	const response = await resolve(event);

	return response;
};
