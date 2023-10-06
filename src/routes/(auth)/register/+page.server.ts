import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate, setError } from 'sveltekit-superforms/server';
import { env } from '$env/dynamic/public';
import type { Action, Actions, PageServerLoad } from './$types';
import { getClientByEnvironment } from '$lib/client';
import { schema } from './schema';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}

	const form = await superValidate(request, schema);

	return { form };
};

const register: Action = async ({ cookies, request }: any) => {
	const form = await superValidate(request, schema);

	if (!form.valid) {
		return fail(400, { form });
	}

	const userURL = env.PUBLIC_USERS_URL;
	const authURL = env.PUBLIC_AUTH_URL;

	try {
		const Client = getClientByEnvironment();
		await Client.createUser(userURL, form.data.username, form.data.password, form.data.email);

		const getAuthToken = Client.getAuthToken;
		const token = await getAuthToken(authURL, form.data.username, form.data.password);

		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});
	} catch (reason: any) {
		const data = reason.response ? reason.response.data : reason.message;

		const usernameError = data.username && data.username[0];
		const passwordError = data.password && data.password[0];
		const emailError = data.email && data.email[0];
		if (usernameError) {
			setError(form, 'username', usernameError);
		}
		if (emailError) {
			setError(form, 'email', emailError);
		}
		if (passwordError) {
			setError(form, 'password', passwordError);
		}

		return { form };
	}

	return { form };
};

export const actions: Actions = { default: register };
