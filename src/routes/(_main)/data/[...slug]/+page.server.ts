import { redirect, error } from '@sveltejs/kit';
import { fetchClient } from '$lib/client';
import { getLibraryResources } from '$lib/api/library.js';

export const load = async ({ locals, params, depends }) => {
	depends('app:reload');
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const session = locals.user.token;

	if (!session) {
		throw error(404, {
			message: 'Are you logged in?'
		});
	}

	const isUploads = params.slug.split('/')[1];

	if (isUploads !== 'uploads') {
		throw error(404, {
			message: 'Are you trying to browse the uploads space?'
		});
	}

	const client = fetchClient(session, locals.user.cubeurl);
	await client.setUrls();
	const data = await getLibraryResources(client, params.slug, 0);
	return data;
};
