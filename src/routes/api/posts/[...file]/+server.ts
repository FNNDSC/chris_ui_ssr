import { json } from '@sveltejs/kit';
import db from '$db/mongo';

export const GET = async ({ url }) => {
	const pathnameList = url.pathname.split('/');

	const currentPath = pathnameList[pathnameList.length - 1];
	const queryPath = currentPath.split('.json')[0];

	const query = { name: queryPath };

	const cursor = db.collection('ohif').find(query);

	let json: any = {};

	for await (const doc of cursor) {
		json = doc.data;
	}

	return new Response(JSON.stringify(json), {
		status: 200,
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

export const POST = async ({ request }) => {
	const data = await request.json();

	const myCollection = db.collection('ohif');

	const query = { name: data.name }; // Define your query criteria

	// Create the new document you want to replace with
	const newDocument = {
		name: data.name,
		data: data.finalObject
	};

	// Use findOneAndUpdate to check if a document with the same name exists and replace it if found
	await myCollection.findOneAndUpdate(
		query,
		{ $set: newDocument }, // Use $set to update the existing document
		{ upsert: true } // If no matching document found, insert a new one
	);
	return json(
		{ success: true },
		{
			status: 200
		}
	);
};
