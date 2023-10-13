import type Client from '@fnndsc/chrisapi';
import type { FileType } from '$lib/types/Data';

export async function getLibraryResources(client: Client, path: string, offset: number) {
	const limit = 30;
	const uploads = await client.getFileBrowserPaths({
		limit,
		offset,
		path: path
	});

	const pathList = await client.getFileBrowserPath(path);

	const fileList = await pathList.getFiles({
		limit,
		offset
	});

	const parsedUpload =
		uploads.data && uploads.data[0].subfolders ? JSON.parse(uploads.data[0].subfolders) : [];

	const folders = parsedUpload.map((folder: string) => {
		return {
			name: folder,
			path
		};
	});

	const folderCount = folders.length;
	const filesCount = fileList.totalCount === -1 ? 0 : fileList.totalCount;

	const files: FileType[] = fileList.data ? fileList.data : [];
	const data = {
		folders,
		files,
		offset,
		limit,
		totalCount: folderCount + filesCount,
		nextPage: fileList.hasNextPage || uploads.hasNextPage
	};
	return data;
}
