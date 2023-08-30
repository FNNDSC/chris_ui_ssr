import { json } from '@sveltejs/kit';
import db from '$db/mongo';

export const GET = async ({ url }) => {
	console.log('URL', url);
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
		status: 200
	});
};

export const POST = async ({ request }) => {
	const data = await request.json();

	const myCollection = db.collection('ohif');

	myCollection.insertOne({
		name: data.name,
		data: data.finalObject
	});

	return json({
		status: 200
	});
};
