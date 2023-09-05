export const GET = async ({ url, fetch }) => {
	const pathNameSplit = url.pathname.split('/api/uploadedfiles/')[1].split('/');
	const folder = pathNameSplit[0];
	const file = pathNameSplit.slice(1).join('/');
	const data = await fetch(`/api/files?folder=${folder}&file=${file}`);
	const blob = await data.blob();

	const responseData = new Response(blob, {
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

	return responseData;
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
