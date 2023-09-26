import Client from '@fnndsc/chrisapi';
import { browser, dev } from '$app/environment';
import { env } from '$env/dynamic/public';

export const getClientByEnvironment = (): typeof Client => {
	if (dev) {
		return Client;
	}

	if (browser && !dev) {
		return Client;
	}

	//@ts-ignore
	return Client.default;
};

export const fetchClient = (token: string) => {
	//@ts-ignore
	const clientClass = getClientByEnvironment();

	const client: Client = new clientClass(env.PUBLIC_API_URL, {
		token
	});

	return client;
};
