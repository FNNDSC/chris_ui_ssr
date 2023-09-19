import { json, error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export const GET = async ({ url }) => {
	const pathnameList = url.pathname.split('/');
	const currentPath = pathnameList[pathnameList.length - 1];
	const queryPath = currentPath.split('.json')[0];
	const readPath = 'ohif/' + queryPath + `/${queryPath}.json`;
	const data = await fs.promises.readFile(readPath);

	if (!data) {
		throw error(404, {
			message: 'No file was found'
		});
	}

	return new Response(data, {
		status: 200,
		headers: {
			'Content-type': 'application/json',
			credentials: 'include',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,POST',
			'Access-Control-Allow-Headers':
				'authorization, x-client-info, apikey, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
		}
	});
};

export const POST = async ({ request }) => {
	try {
		const data = await request.json();

		const outputDirectory = 'ohif/' + data.name;
		if (!fs.existsSync(outputDirectory)) {
			fs.mkdirSync(outputDirectory, { recursive: true }); // Create directory recursively
		}
		const pathToSave = path.join(outputDirectory, `${data.name}.json`);

		fs.writeFile(pathToSave, JSON.stringify(data.finalObject), 'utf-8', (err) => {
			if (err) {
				console.warn('Error in writing the JSON file:', err);
			}
		});
	} catch (errorMessage) {
		throw error(404, {
			message: errorMessage as string
		});
	}

	return json(
		{ success: true },
		{
			status: 200
		}
	);
};
