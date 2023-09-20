import Client from '@fnndsc/chrisapi';
import { PUBLIC_API_URL } from '$env/static/public';
import { dev } from '$app/environment';

export const fetchClient = (token: string) => {
	//@ts-ignore
	const clientClass = dev ? Client : Client.default;

	const client: Client = new clientClass(PUBLIC_API_URL, {
		token
	});
	return client;
};
