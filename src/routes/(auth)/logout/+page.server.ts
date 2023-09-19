import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	// we only use this endpoint for the api
	// and don't need to see the page
	cookies.delete('session');
	throw redirect(302, '/login');
};