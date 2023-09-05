import { json } from '@sveltejs/kit';
import db from '$db/mongo';
import { getFileName } from '$lib/utilities/library/index.js';

export const GET = async ({ url }) => {
	const folder = url.searchParams.get('folder');
	const file = url.searchParams.get('file');

	const cursor = db.collection(`${folder}`).find({ name: file });

	let json: any = {};

	for await (const doc of cursor) {
		json = doc.data;
	}

	const fileName = getFileName(json.file.fname);

	const urlToFetch = `http://localhost:8000/api/v1/uploadedfiles/${json.file.id}/${fileName}`;

	const response = await fetch(urlToFetch, {
		headers: {
			Authorization: `Token ${json.token} `
		}
	});

	const blob = await response.blob();

	return new Response(blob, {
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

export const POST = async ({ request }) => {
	const data = await request.json();
	const myCollection = db.collection(`${data.folder}`);
	const query = { name: data.file.fname };

	const newDocument = {
		name: data.file.fname,
		data: {
			file: data.file,
			token: data.token
		}
	};

	await myCollection.findOneAndUpdate(
		query,
		{
			$set: newDocument
		},
		{
			upsert: true
		}
	);

	return json({
		status: 200
	});
};
