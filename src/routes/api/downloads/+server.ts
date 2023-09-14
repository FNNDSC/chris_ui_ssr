import { fetchClient } from '$lib/client.js';
import { getFileName } from '$lib/utilities/library/index.js';
import fs from 'fs';
import path from 'path';
import { PUBLIC_API_URL } from '$env/static/public';

interface UploadedFile {
	id: number;
	fname: string;
	fsize: number;
}

export const GET = () => {
	return new Response(JSON.stringify({ success: 'True' }));
};

export const POST = async ({ request, fetch }) => {
	const data = await request.json();

	const { fname, token, userDirectory } = data;

	const client = fetchClient(token);
	const fileList = await client.getUploadedFiles({
		fname,
		limit: 100000
	});

	const files: UploadedFile[] = fileList.data;
	const preserveFilePath = `${userDirectory}/${fname}`;

	if (!fs.existsSync(preserveFilePath)) {
		fs.mkdirSync(preserveFilePath, { recursive: true });
	}

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const fileName = getFileName(file.fname);
		const urlPath = `${PUBLIC_API_URL}uploadedfiles/${file.id}/${fileName}`;

		const response = await fetch(urlPath, {
			method: 'GET',
			headers: {
				Authorization: `Token ${token}`,
				'Content-Type': 'blob'
			}
		});
		const blob = await response.blob();

		const buffer = Buffer.from(await blob.arrayBuffer());
		const filePath = path.join(preserveFilePath, fileName);

		fs.writeFile(filePath, buffer, (error) => {
			if (error) {
				console.error('Error writing File:', error);
			} else {
				console.log('File has been saved');
			}
		});
	}

	return new Response(
		JSON.stringify({
			success: true
		})
	);
};
