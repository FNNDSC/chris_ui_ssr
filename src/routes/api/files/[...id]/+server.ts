import { json } from '@sveltejs/kit';
import db from '$db/mongo';
import { getFileName } from '$lib/utilities/library/index.js';
import fs from 'fs';
import path from 'path';

export const GET = async ({ url }) => {
	const pathSplit = url.pathname.split('files/')[1];
	const fileName = getFileName(pathSplit);

	const readPath = `${pathSplit}/${fileName}`;

	const data = await fs.promises.readFile(readPath);

	if (!data) {
		console.warn('No file was found');
	}

	return new Response(data, {
		status: 200,
		headers: {
			'Content-Type': 'application/dicom',
			credentials: 'include',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,POST',
			'Access-Control-Allow-Headers':
				'authorization, x-client-info, apikey, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
		}
	});
};

export const POST = async ({ request, url }) => {
	const data = await request.blob();

	const buffer = Buffer.from(await data.arrayBuffer());

	const outputDirectory = 'ohif/' + url.pathname.split('files/')[1];

	if (!fs.existsSync(outputDirectory)) {
		fs.mkdirSync(outputDirectory, { recursive: true }); // Create directory recursively
	}

	const fileName = getFileName(outputDirectory);

	const filePath = path.join(outputDirectory, fileName);

	// Now, you can write the Buffer to a file
	fs.writeFile(filePath, buffer, (error) => {
		if (error) {
			console.error('Error writing file:', error);
		} else {
			console.log('File has been saved.');
		}
	});

	return json({
		status: 200
	});
};

export const OPTIONS = async () => {
	return new Response('ok', {
		headers: {
			credentials: 'include',
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,POST',
			'Access-Control-Allow-Headers':
				'authorization, x-client-info, apikey, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
		}
	});
};
