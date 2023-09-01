import { json } from '@sveltejs/kit';
import db from '$db/mongo';
import { getFileName } from '$lib/utilities/library/index.js';

export const GET = async ({ url, fetch }) => {
	const folder = url.searchParams.get('folder');
	const file = url.searchParams.get('file');

	const cursor = db.collection(`${folder}`).find({ name: file });

	let json: any = {};

	for await (const doc of cursor) {
		json = doc.data;
	}

	const fileName = getFileName(json.data.fname);

	//const urlToFetch = `http://localhost:8000/api/v1/uploadedfiles/${json.data.id}/${fileName}`;

	/*
     headers: {
			Authorization: `Token ${json.data.token}`
		}

	*/

	const urlToFetch =
		'https://ohif-dicom-json-example.s3.amazonaws.com/LIDC-IDRI-0001/01-01-2000-30178/3000566.000000-03192/1-001.dcm';

	const data = await fetch(urlToFetch);

	return new Response(JSON.stringify(data.blob), {
		status: 200,
		headers: {
			'Content-Type': 'blob',
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
	myCollection.insertOne({
		name: data.filename,
		data: data.file
	});

	return json({
		status: 200
	});
};
