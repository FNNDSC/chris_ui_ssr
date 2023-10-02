import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// we only use this endpoint for the api
	// and don't need to see the page
	cookies.delete('session', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(302, '/login');
};
