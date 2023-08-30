import axios from 'axios';
import * as dicomParser from 'dicom-parser';
import { invalidate } from '$app/navigation';
import { downloadStore, type DownloadState } from '$lib/stores/downloadStore';
import { uploadStore, type UploadState } from '$lib/stores/uploadStore';
import { fetchClient } from '$lib/client';
import standardDataElements from './standardElements';

import type { AxiosProgressEvent } from 'axios';

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

export async function fetchFile(fname: string, token: string, type: string) {
	const client = await clientSetup(token);
	const fetchedFileList = await client.getUploadedFiles({
		limit: 10000000,
		fname
	});

	const fetchedFile = fetchedFileList.getItems() as any;

	return type === 'file' ? fetchedFile[0] : fetchedFile;
}

export async function handleFileDownload(file: any, token: string) {
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

export async function handleFileDelete(file: any, token: string) {
	const fileData = await fetchFile(file.fname, token, 'file');
	fileData.delete();
	invalidate('app:reload');
}
export async function handleFolderDelete(folder: any, token: string) {
	const name = `${folder.path}/${folder.name}`;
	const files = await fetchFile(name, token, 'folder');
	for (const file of files) {
		file.delete();
	}
	invalidate('app:reload');
}

export async function handleFolderDownload(folder: any, token: string) {
	downloadStore.setNewNotification();
	downloadStore.setFolderStep(folder.name, 'Preparing to zip');

	const client = await clientSetup(token);
	const dircopyPlugin = await client.getPlugins({
		name: 'pl-dircopy'
	});

	const dircopyList = dircopyPlugin.getItems() as any;

	if (!dircopyList) {
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

	const zipPluginList: any = await client.getPlugins({
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
	} else {
		downloadStore.setFolderStep(folder.name, 'Preparing to Download');

		//@ts-ignore
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
			console.log('Error', error.response || error.message);
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

export const fileViewerMap: any = {
	stats: 'IFrameDisplay',
	txt: 'IFrameDisplay',
	html: 'IFrameDisplay',
	pdf: 'PdfDisplay',
	csv: 'IFrameDisplay',
	ctab: 'IFrameDisplay',
	json: 'JsonDisplay',
	png: 'ImageDisplay',
	jpg: 'ImageDisplay',
	jpeg: 'ImageDisplay',
	gif: 'ImageDisplay',
	dcm: 'DcmDisplay',
	default: 'CatchallDisplay',
	nii: 'NiftiDisplay',
	gz: 'CatchallDisplay',
	mgz: 'XtkDisplay',
	fsm: 'XtkDisplay',
	crv: 'XtkDisplay',
	smoothwm: 'XtkDisplay',
	pial: 'XtkDisplay'
};

export function getFileExtension(filename: string) {
	const name = filename.substring(filename.lastIndexOf('.') + 1);
	return name;
}

function studyTags(metaData: any, numOfInstances: number) {
	return {
		StudyInstanceUID: metaData['StudyInstanceUID'] || '',
		StudyDescription: metaData['StudyDescription'] || '',
		StudyDate: metaData['StudyDate'] || '',
		StudyTime: metaData['StudyTime'] || '',
		PatientName: metaData['PatientName'] || '',
		PatientID: metaData['PatientID'] || '',
		Modalities: metaData['Modalities'] || '',
		NumInstances: numOfInstances,
		PatientAge: metaData['PatientAge'] || '',
		PatientSex: metaData['PatientSex'] || ''
	};
}

function seriesTags(metaData: any) {
	return {
		SeriesDescription: metaData['SeriesDescription'] || '',
		SeriesInstanceUID: metaData['SeriesInstanceUID'] || '',
		SeriesNumber: metaData['SeriesNumber'] || '',
		SeriesDate: metaData['SeriesDate'] || '',
		SeriesTime: metaData['SeriesTime'] || '',
		Modality: metaData['Modality'] || '',
		SliceThickness: metaData['SliceThickness'] || ''
	};
}

export async function handleOhif(folder: any, token: string) {
	const files = await fetchFile(`${folder.path}/${folder.name}`, token, 'folder');

	const filteredFiles = files.filter((file: any) => {
		if (getFileExtension(file.data.fname) === 'dcm') return file;
	});

	let payload: any = {
		instances: []
	};

	function setupReader(blob: Blob) {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = function () {
				try {
					if (reader.result) {
						//@ts-ignore
						const byteArray = new Uint8Array(reader.result);

						const testOutput: any[] = [];
						const output: any[] = [];
						const dataSet = dicomParser.parseDicom(byteArray);
						const dictionary = createDataSet(dataSet);
						console.log('Dictionary', dictionary);

						/*
						console.log('Dataset', dataSet);
						dumpDataSet(dataSet, output, testOutput);
						const merged = Object.assign({}, ...testOutput);
						// callback(merged, file, fileName);
						resolve(merged);
						*/
					}
				} catch (error) {
					console.log('Error', error);
				}
			};
			reader.readAsArrayBuffer(blob);
		});
	}

	for (let i = 0; i < filteredFiles.length; i++) {
		const file = filteredFiles[i];
		const blob = await file.getFileBlob();
		const merged = await setupReader(blob);
		const url = `dicomweb:http://localhost:5173/api/uploadedfiles/${file.data.id}.dcm`;

		payload = {
			...payload,
			instances: [
				...payload.instances,
				{
					url: url,
					metadata: merged
				}
			]
		};
	}

	/*

	const dataForSeries = payload.instances[0];

	const studyTagsDict = studyTags(dataForSeries.metadata, payload.instances.length);
	const seriesTagsDict = seriesTags(dataForSeries.metadata);
	const finalObject = {
		studies: [
			{
				...studyTagsDict,
				series: [
					{
						...seriesTagsDict,
						...payload
					}
				]
			}
		]
	};

	console.log('Final Object', finalObject);

	const response = await fetch('/api/posts/', {
		method: 'POST',
		body: JSON.stringify({ name: folder.name, finalObject }),
		headers: {
			'content-type': 'application/json'
		}
	});

	return response;
	*/

	return {};
}

function createDataSet(dataSet: any) {
	console.log('DataSet', dataSet);

	const dicomElements = [
		'x00080050', // Accession Number
		'x00280100', // Bits Allocated
		'x00280101', // Bits Stored
		'x00280011', // Columns
		'x00200052', // Frame of Reference UID
		'x00280102', // High Bit
		'x00200037', // Image Orientation Patient
		'x00200032', // Image Position Patient
		'x00080008', // Image Type
		'x00200013', // Instance Number
		'x00080061', // Modalities
		'x00080060', // Modality
		'x00201209', // Number of Instances
		'x00101010', // Patient Age
		'x00100020', // Patient ID
		'x00100010', // Patient Name
		'x00100040', // Patient Sex
		'x00280004', // Photometric Interpretation
		'x00280103', // Pixel Representation
		'x00280030', // Pixel Spacing
		'x00280010', // Rows
		'x00080016', // SOP Class UID
		'x00080018', // SOP Instance UID
		'x00280002', // Samples Per Pixel
		'x00080022', // Time
		'x0020000d', // Study Instance UID
		'x00200011', // Series Number
		'x00180088', // Spacing Between Slices
		'x00080031', // Series Time
		'x00180081', // View Position
		'x00080020', // Study Date
		'x00080030', // Study Time
		'x00281073', // Window Center
		'x00281074', // Window Width
		'x00080021' // Series Date
	];

	// Extract values from the parsed DICOM dataset
	const dicomValues: any = {};
	dicomElements.forEach((elementTag) => {
		const value = dataSet.string(elementTag);
		dicomValues[elementTag] = value;
	});

	console.log(dicomValues);
}
