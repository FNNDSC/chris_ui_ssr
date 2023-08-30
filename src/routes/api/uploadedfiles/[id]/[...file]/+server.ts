import { json } from '@sveltejs/kit';

export const GET = async ({ url, fetch }) => {
	console.log('URL', url);
	/*
	const response = await fetch(
		'https://ohif-dicom-json-example.s3.amazonaws.com/LIDC-IDRI-0001/01-01-2000-30178/3000566.000000-03192/1-002.dcm'
	);

	const data = await response.blob();

	*/

	const responseData = new Response(JSON.stringify({ success: true }), {
		headers: {
			'Content-Type': 'application/dicom'
		}
	});

	return responseData;
};

export const OPTIONS = async ({ url }) => {
	return new Response('ok', {
		headers: {
			'Access-Control-Allow-Credentials': 'true',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'OPTIONS,POST',
			'Access-Control-Allow-Headers':
				'authorization, x-client-info, apikey, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
		}
	});
};
