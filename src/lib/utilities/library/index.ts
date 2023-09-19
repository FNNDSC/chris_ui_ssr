import axios from 'axios';
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

async function clientSetup(token: string) {
	const client = fetchClient(token);
	await client.setUrls();
	return client;
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

export async function fetchFile(fname: string, token: string, type: string) {
	const client = await clientSetup(token);
	const fetchedFileList = await client.getUploadedFiles({
		limit: 10000000,
		fname
	});

	const fetchedFile = fetchedFileList.getItems() as any;
	return type === 'file' ? fetchedFile[0] : fetchedFile;
}

export async function handleFileDelete(file: FileType, token: string) {
	const fileData = await fetchFile(file.fname, token, 'file');
	fileData.delete();
	invalidate('app:reload');
}

export async function handleFolderDelete(folder: FolderType, token: string) {
	const name = `${folder.path}/${folder.name}`;
	const files = await fetchFile(name, token, 'folder');
	for (const file of files) {
		file.delete();
	}
	invalidate('app:reload');
}

export async function handleFileDownload(file: FileType, token: string, path: string | null) {
	const response = await fetch('/api/downloads', {
		method: 'POST',
		body: JSON.stringify({
			fname: file.fname,
			token,
			userDirectory: path
		})
	});

	return response;
}

export async function handleFolderDownload(folder: FolderType, token: string, path: string | null) {
	const response = await fetch('/api/downloads', {
		method: 'POST',
		body: JSON.stringify({
			fname: `${folder.path}/${folder.name}`,
			token,
			userDirectory: path
		})
	});

	return response;
}

export async function handleZipDownloadFile(file: FileType, token: string) {
	const fileData = await fetchFile(file.fname, token, 'file');
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
						downloadStore.setLargeFileDownload(fileName, progress, 'Download Complete', controller);
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

export async function handleZipFolderDownload(folder: FolderType, token: string) {
	downloadStore.setNewNotification();
	downloadStore.setFolderStep(folder.name, 'Preparing to zip');

	const client = await clientSetup(token);
	const dircopyPlugin = await client.getPlugins({
		name: 'pl-dircopy'
	});

	const dircopyList = dircopyPlugin.getItems() as any;

	if (!dircopyList || dircopyList.length === 0) {
		downloadStore.setFolderStep(folder.name, 'Download Failed');
		return;
	}

	const dircopy = dircopyList[0];

	const dircopyParams = {
		dir: folder.path,
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

export async function handleUpload(
	files: FileList,
	isFolder: boolean,
	currentPath: string,
	token: string
) {
	const items = Array.from(files);
	const client = await clientSetup(token);
	const url = client.uploadedFilesUrl;

	uploadStore.setNewNotification();

	let count = 0;
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
	});
	invalidate('app:reload');
}

export async function createNewFolder(newFolder: string, currentPath: string, token: string) {
	const client = await clientSetup(token);

	if (!newFolder) {
		newFolder = 'Untitled';
	}

	const content = 'Welcome';
	const file = new Blob([content], { type: 'text/plain' });
	const path = `${currentPath}/${newFolder}`;
	const formData = new FormData();
	formData.append('upload_path', `${path}/Welcome.txt`);
	formData.append('fname', file, 'Welcome.txt');

	try {
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
	const actions = ['Upload Complete', 'Upload Cancelled', 'Upload Failed'];
	if (actions.includes(currentStep)) {
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
	token: string,
	type: string,
	file?: FileType
) {
	const response = await fetch('/api/uploadedfiles', {
		method: 'POST',
		body: JSON.stringify({
			path,
			token,
			folderForJSON,
			type,
			file
		})
	});

	return response;
}
