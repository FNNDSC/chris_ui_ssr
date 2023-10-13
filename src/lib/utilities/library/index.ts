import axios from 'axios';
import type Client from '@fnndsc/chrisapi';
import { invalidate } from '$app/navigation';
import { downloadStore, type DownloadState } from '$lib/stores/downloadStore';
import { uploadStore, type UploadState } from '$lib/stores/uploadStore';
import { fetchClient } from '$lib/client';
import type { AxiosProgressEvent } from 'axios';
import type { FileType, FolderType } from '$lib/types/Data';
import type { FileViewerType } from '$lib/types/Library';

export function download(blob: Blob, name: string) {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.target = '_blank';
	link.href = url;
	link.setAttribute('download', name);
	document.body.appendChild(link);
	link.click();
	window.URL.revokeObjectURL(url);
	document.body.removeChild(link);
}

async function clientSetup(token: string, cubeurl?: string) {
	const client = fetchClient(token, cubeurl);
	await client.setUrls();
	return client;
}

export async function handleUpload(
	files: FileList,
	isFolder: boolean,
	currentPath: string,
	token: string,
	cubeurl?: string
) {
	const items = Array.from(files);
	const client = await clientSetup(token, cubeurl);
	const url = client.uploadedFilesUrl;

	uploadStore.setNewNotification();

	let count = 0;
	const filePromises = Promise.allSettled(
		items.map(async (file) => {
			const formData = new FormData();
			const name = isFolder ? file.webkitRelativePath : file.name;
			formData.append('upload_path', `${currentPath}/${name}`);
			formData.append('fname', file, file.name);
			const controller = new AbortController();

			try {
				const config = {
					headers: { Authorization: 'Token ' + token },
					signal: controller.signal,
					onUploadProgress: (progressEvent: AxiosProgressEvent) => {
						if (progressEvent && progressEvent.progress) {
							const progress = Math.round(progressEvent.progress * 100);

							if (!isFolder) {
								uploadStore.setStatusForFiles('Uploading', file.name, progress, controller);

								if (progress === 100) {
									uploadStore.setStatusForFiles('Upload Complete', file.name, progress, controller);
								}
							} else {
								if (progress === 100) {
									count++;
									const fileName = files[0].webkitRelativePath.split('/')[0];
									uploadStore.setStatusForFolders(
										'Uploading',
										fileName,
										count,
										files.length,
										controller
									);

									if (count === files.length) {
										uploadStore.setStatusForFolders(
											'Upload Complete',
											fileName,
											count,
											files.length,
											controller
										);
									}
								}
							}
						}
					}
				};
				await axios.post(url, formData, config);
			} catch (error: any) {
				uploadStore.setStatusForFiles('Upload Failed', file.name, 0, controller);
			}
		})
	);

	if ((await filePromises).length === items.length) {
		invalidate('app:reload');
	}
}

export function getFileName(fname: string) {
	const fileNameArray = fname.split('/');
	const fileName = fileNameArray[fileNameArray.length - 1];
	return fileName;
}

export function getFolderForJSON(fname: string) {
	const fileNameArray = fname.split('/');
	const fileName = fileNameArray[fileNameArray.length - 2];
	return fileName;
}

export async function handleFileDelete(file: FileType, token: string, cubeurl?: string) {
	const client = fetchClient(token, cubeurl);
	const fileToDelete = await client.getUploadedFiles({
		fname_exact: file.fname
	});

	const fileItems = fileToDelete.getItems();

	if (fileItems) {
		await fileItems[0].delete();
	}
	invalidate('app:reload');
}

export async function handleFolderDelete(folder: FolderType, token: string, cubeurl?: string) {
	uploadStore.setNewNotification();
	const client = fetchClient(token, cubeurl);
	const pathToDelete = `${folder.path}/${folder.name}`;
	const filePath: { [key: string]: FileType[] } = {};
	const controller = new AbortController();

	await recursivelyOrganizeFiles(pathToDelete, filePath, client);

	for (const path in filePath) {
		const files = filePath[path];

		for (let i = 0; i < files.length; i++) {
			uploadStore.setStatusForFolders('Deleting', path, i, files.length, controller);
			const file = files[i];
			const fileToDelete = await client.getUploadedFiles({
				fname_exact: file.fname
			});

			const fileItems = fileToDelete.getItems();

			if (fileItems) {
				await fileItems[0].delete();
			}
		}
		uploadStore.setStatusForFolders(
			'Delete Complete',
			path,
			files.length,
			files.length,
			controller
		);
	}

	invalidate('app:reload');
}

export async function handleFileExport(file: FileType) {
	const response = await fetch('/api/downloads', {
		method: 'POST',
		body: JSON.stringify({
			fname: file.fname
		})
	});

	return response;
}

export async function handleFolderExport(folder: FolderType) {
	const response = await fetch('/api/downloads', {
		method: 'POST',
		body: JSON.stringify({
			fname: `${folder.path}/${folder.name}`
		})
	});

	return response;
}

export async function handleZipDownloadFile(file: FileType, token: string, cubeurl?: string) {
	const client = fetchClient(token, cubeurl);
	const fileList = await client.getUploadedFiles({
		fname: file.fname
	});
	const fileItems = fileList.getItems();

	if (fileItems) {
		const fileData = fileItems[0];

		const fileSize = fileData.data.fsize;
		const fileName = getFileName(fileData.data.fname);

		if (fileSize > 250000) {
			downloadStore.setNewNotification();
			const url = `${fileData.url}${fileName}`;
			const controller = new AbortController();

			downloadStore.setLargeFileDownload(fileName, 0, 'Preparing to Download', controller);

			try {
				const response = await axios.get(url, {
					responseType: 'blob',
					headers: {
						Authorization: `Token ${token}`
					},
					signal: controller.signal,
					onDownloadProgress: (progressEvent) => {
						const progress = Math.floor((progressEvent.loaded / fileSize) * 100);
						downloadStore.setLargeFileDownload(fileName, progress, 'Downloading', controller);

						if (progress === 100) {
							downloadStore.setLargeFileDownload(
								fileName,
								progress,
								'Download Complete',
								controller
							);
						}
					}
				});

				if (response && response.data) {
					const blob = new Blob([response.data]);
					download(blob, fileName);
				}
			} catch (error) {
				downloadStore.setLargeFileDownload(fileName, 0, 'Download Cancelled', controller);
			}
		} else {
			const blob = await fileData.getFileBlob();
			download(blob, fileName);
		}
	}
}

export async function handleZipFolderDownload(folder: FolderType, token: string, cubeurl?: string) {
	const path = `${folder.path}/${folder.name}`;

	downloadStore.setNewNotification();
	downloadStore.setFolderStep(folder.name, 'Preparing to Zip');

	const client = await clientSetup(token, cubeurl);
	const dircopyPlugin = await client.getPlugins({
		name: 'pl-dircopy'
	});

	const dircopyList = dircopyPlugin.getItems() as any;

	if (!dircopyList || dircopyList.length === 0) {
		downloadStore.setFolderStep(folder.name, 'Download Failed - Register Dircopy');
		return;
	}

	const dircopy = dircopyList[0];

	const dircopyParams = {
		dir: path,
		previous_id: 0,
		title: `${folder.name}.zip`
	};

	const dircopyPluginInstance = await client.createPluginInstance(dircopy.data.id, dircopyParams);

	if (!dircopyPluginInstance) {
		downloadStore.setFolderStep(folder.name, 'Download Failed');
		return;
	}

	const cancelledDircopy = function cancelled() {
		dircopyPluginInstance.put({
			status: 'cancelled'
		});
		downloadStore.setFolderStep(folder.name, 'Download Cancelled');
		return;
	};

	downloadStore.cancelDownload(folder.name, cancelledDircopy);
	downloadStore.setFolderStep(folder.name, 'Zipping Files');

	const zipPluginArgs = {
		title: 'zip_files',
		previous_id: dircopyPluginInstance.data.id,
		inputFile: 'input.meta.json',
		noJobLogging: true,
		exec: 'zip -r %outputDir/parent.zip %inputDir'
	};

	const zipPluginList = await client.getPlugins({
		name_exact: 'pl-pfdorun'
	});

	if (!zipPluginList || !zipPluginList.data) {
		downloadStore.setFolderStep(folder.name, 'Download Failed');
		return;
	}

	const zipPluginInstance = await client.createPluginInstance(
		zipPluginList.data[0].id,
		zipPluginArgs
	);

	if (!zipPluginInstance) {
		downloadStore.setFolderStep(folder.name, 'Download Failed');
		return;
	}

	const cancelledZip = function cancelled() {
		zipPluginInstance.put({
			status: 'cancelled'
		});
		downloadStore.setFolderStep(folder.name, 'Download Cancelled');
	};

	downloadStore.cancelDownload(folder.name, cancelledZip);

	let status = 'started';

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

	do {
		await delay(5000);
		const details = await zipPluginInstance.get();
		status = details.data.status;
	} while (!['finishedSuccessfully', 'cancelled', 'finishedWithError'].includes(status));

	downloadStore.setFolderStep(folder.name, 'Zip Complete');

	const filesList = await zipPluginInstance.getFiles({
		limit: 10
	});

	const files = filesList.getItems();

	if (files?.length === 0 || ['cancelled', 'finishedWithError'].includes(status)) {
		downloadStore.setFolderStep(folder.name, 'Download Cancelled');
		return;
	} else if (files) {
		downloadStore.setFolderStep(folder.name, 'Preparing to Download');
		const file = files[0];

		const fileName = getFileName(file.data.fname);
		const url = `${file.url}/${fileName}`;

		const controller = new AbortController();

		try {
			const response = await axios.get(url, {
				responseType: 'blob',
				headers: {
					Authorization: `Token ${token}`
				},
				signal: controller.signal,
				onDownloadProgress: (progressEvent) => {
					const progress = Math.floor((progressEvent.loaded / file.data.fsize) * 100);
					downloadStore.cancelDownload(folder.name, controller.abort);
					downloadStore.setFolderProgress(folder.name, progress);

					if (progress === 100) {
						downloadStore.setFolderStep(folder.name, 'Download Complete');
					}
				}
			});

			if (response && response.data) {
				const blob = new Blob([response.data]);
				download(blob, fileName);
			}
		} catch (error) {
			downloadStore.setFolderStep(folder.name, 'Download Failed');
			return;
		}
	}
}

export async function createNewFolder(
	newFolder: string,
	currentPath: string,
	token: string,
	cubeurl?: string
) {
	try {
		const client = await clientSetup(token, cubeurl);

		if (!newFolder) {
			newFolder = 'Untitled';
		}

		const content = 'Welcome';
		const file = new Blob([content], { type: 'text/plain' });
		const path = `${currentPath}/${newFolder}`;
		const formData = new FormData();
		formData.append('upload_path', `${path}/Welcome.txt`);
		formData.append('fname', file, 'Welcome.txt');

		const config = {
			headers: { Authorization: 'Token ' + token }
		};
		await axios.post(client.uploadedFilesUrl, formData, config);
		invalidate('app:reload');
	} catch (error) {
		console.log('Error', error);
	}
}

function getMergedObjects(downloadState: DownloadState, uploadState: UploadState) {
	const downloadObj = {
		...downloadState.fileDownload,
		...downloadState.folderDownload
	};

	const uploadObj = {
		...uploadState.fileUpload,
		...uploadState.folderUpload
	};

	return { downloadObj, uploadObj };
}

export function getActiveStatus(downloadState: DownloadState, uploadState: UploadState) {
	let showNotification = false;
	const { downloadObj, uploadObj } = getMergedObjects(downloadState, uploadState);

	if (
		(Object.keys(downloadObj).length > 0 || Object.keys(uploadObj).length > 0) &&
		!downloadState.isOpen &&
		!uploadState.isOpen
	) {
		showNotification = true;
	}
	return showNotification;
}

export function shouldDeleteDownload(currentStep: string) {
	const actions = ['Download Complete', 'Download Cancelled', 'Download Failed'];
	if (actions.includes(currentStep)) {
		return true;
	}

	return false;
}

export function shouldDeleteUpload(currentStep: string) {
	console.log('CurrentStep', currentStep);
	if (
		currentStep.includes('Cancelled') ||
		currentStep.includes('Failed') ||
		currentStep.includes('Complete')
	) {
		return true;
	}

	return false;
}

export function getCurrentlyActive(
	name: string,
	downloadState: DownloadState,
	uploadState: UploadState
) {
	const { downloadObj, uploadObj } = getMergedObjects(downloadState, uploadState);
	const showNotification =
		(downloadObj[name] && !shouldDeleteDownload(downloadObj[name].currentStep)) ||
		(uploadObj[name] && !shouldDeleteUpload(uploadObj[name].currentStep));

	if (showNotification) {
		return true;
	}
	return false;
}

export const fileViewerMap: FileViewerType = {
	stats: 'IFrameDisplay',
	txt: 'IFrameDisplay',
	html: 'IFrameDisplay',
	ctab: 'IFrameDisplay',
	png: 'ImageDisplay',
	jpg: 'ImageDisplay',
	jpeg: 'ImageDisplay',
	gif: 'ImageDisplay',
	dcm: 'DcmDisplay'
};

export function getFileExtension(filename: string) {
	const name = filename.substring(filename.lastIndexOf('.') + 1);
	return name;
}

export async function handleOhif(
	path: string,
	folderForJSON: string,
	type: string,
	file?: FileType
) {
	const response = await fetch('/api/metadata', {
		method: 'POST',
		body: JSON.stringify({
			path,
			folderForJSON,
			type,
			file
		})
	});

	return response;
}

async function getFileForPath(path: string, client: Client) {
	const pathList = await client.getFileBrowserPath(path);
	const files = await pathList.getFiles({ limit: 100000 });
	return files;
}

export async function recursivelyOrganizeFiles(path: string, recursivePath: any, client: Client) {
	console.log('Path', path);
	const uploads = await client.getFileBrowserPaths({
		path
	});

	if (uploads.data && uploads.data[0].subfolders) {
		const subfolders = JSON.parse(uploads.data[0].subfolders);

		if (subfolders && subfolders.length > 0) {
			for (let i = 0; i < subfolders.length; i++) {
				const folder = subfolders[i];
				const computedPath = `${path}/${folder}`;
				const files = await getFileForPath(path, client);

				if (files && files.data) {
					recursivePath[computedPath] = files.data;
				}
				await recursivelyOrganizeFiles(computedPath, recursivePath, client);
			}
		} else {
			const files = await getFileForPath(path, client);
			if (files && files.data) {
				recursivePath[path] = files.data;
			}
			return;
		}
	} else return;
}
