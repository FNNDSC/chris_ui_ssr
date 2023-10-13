import { fetchClient } from '$lib/client.js';
import { getFileName, recursivelyOrganizeFiles } from '$lib/utilities/library/index.js';
import fs from 'fs';
import path from 'path';
import { env } from '$env/dynamic/public';
import type { FileType } from '$lib/types/Data';

export const GET = () => {
	return new Response(JSON.stringify({ success: 'True' }));
};

export const POST = async ({ request, fetch, locals }) => {
	const data = await request.json();
	const { token, cubeurl } = locals.user;

	const { fname } = data;

	const client = fetchClient(token, cubeurl);

	const recursivePath: { [key: string]: FileType[] } = {};
	await recursivelyOrganizeFiles(fname, recursivePath, client);
	const userDirectory = env.PUBLIC_EXPORT_PATH;

	for (const filePath in recursivePath) {
		const files = recursivePath[filePath];
		for (let i = 0; i < files.length; i++) {
			const file: FileType = files[i];

			try {
				const fileList = await client.getUploadedFiles({
					fname: file.fname
				});

				const { id, fname } = fileList.data[0];
				const fileName = getFileName(fname);
				const urlToFetch = `${env.PUBLIC_API_URL}uploadedfiles/${id}/${fileName}`;

				const responseBlob = await fetch(urlToFetch, {
					method: 'GET',
					headers: {
						Authorization: `Token ${token}`,
						'Content-Type': 'blob'
					}
				});
				const blob = await responseBlob.blob();
				const buffer = Buffer.from(await blob.arrayBuffer());
				const preserveFilePath = `${userDirectory}/${filePath}`;
				const joinedPath = path.join(preserveFilePath, fileName);

				if (!fs.existsSync(preserveFilePath)) {
					fs.mkdirSync(preserveFilePath, { recursive: true });
				}

				fs.writeFile(joinedPath, buffer, (error) => {
					if (error) {
						console.error('Error writing File:', error);
					}
				});
			} catch (error) {
				console.log('Error', error);
			}
		}
	}

	return new Response(
		JSON.stringify({
			success: true
		})
	);
};
