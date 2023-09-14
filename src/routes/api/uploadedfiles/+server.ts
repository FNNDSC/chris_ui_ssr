import { fetchClient } from '$lib/client.js';
import * as dicomParser from 'dicom-parser';
import { getFileExtension, getFileName } from '$lib/utilities/library/index.js';
import { PUBLIC_API_URL, PUBLIC_RESOURCES_URL } from '$env/static/public';
import { string } from 'zod';
import type { UploadedFileList } from '@fnndsc/chrisapi';

async function setupReader(blob: Blob) {
	const buffer = Buffer.from(await blob.arrayBuffer());
	const bufferArray = new Uint8Array(buffer);
	const dataSet = dicomParser.parseDicom(bufferArray);
	const dictionary = createDataSet(dataSet);
	return dictionary;
}

async function recursivelyOrganizeFiles(path: string, token: string, recursivePath: any) {
	const client = fetchClient(token);

	const uploads = await client.getFileBrowserPaths({
		path
	});

	if (uploads.data && uploads.data[0].subfolders) {
		const subfolders = JSON.parse(uploads.data[0].subfolders);
		if (subfolders.length > 0) {
			if (subfolders && subfolders.length > 0) {
				for (let i = 0; i < subfolders.length; i++) {
					const folder = subfolders[i];
					const computedPath = `${path}/${folder}`;
					const pathList = await client.getFileBrowserPath(computedPath);
					const files = await pathList.getFiles({ limit: 100000 });

					if (files && files.data) {
						recursivePath[computedPath] = files.data;
					}
					await recursivelyOrganizeFiles(computedPath, token, recursivePath);
				}
			}
		} else return;
	} else return;
}

export const POST = async ({ request, fetch }) => {
	const data = await request.json();

	const { path, token, folderForJSON } = data;

	const recursivePath: { [key: string]: [] } = {};
	await recursivelyOrganizeFiles(path, token, recursivePath);

	let payload: any = {
		instances: []
	};

	let finalObject: any = {};

	let seriesAcc: any = [];

	for (const path in recursivePath) {
		const files = recursivePath[path];

		for (let i = 0; i < files.length; i++) {
			const file: any = files[i];

			const client = fetchClient(token);
			const fileList = await client.getUploadedFiles({
				fname: file.fname
			});
			const { id, fname } = fileList.data[0];
			const fileName = getFileName(fname);
			const urlToFetch = `${PUBLIC_API_URL}uploadedfiles/${id}/${fileName}`;

			const responseBlob = await fetch(urlToFetch, {
				method: 'GET',
				headers: {
					Authorization: `Token ${token}`,
					'Content-Type': 'blob'
				}
			});

			const blob = await responseBlob.blob();
			await fetch(`/api/files/${fname}`, {
				method: 'POST',
				body: blob,
				headers: {
					'content-type': `${blob.type}`
				}
			});
			
			const merged = await setupReader(blob);
			const url = `dicomweb:${PUBLIC_RESOURCES_URL}api/files/ohif/${fname}`;
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

		const dataForSeries = payload.instances[0];

		const studyTagsDict = studyTags(dataForSeries.metadata, payload.instances.length);
		const seriesTagsDict = seriesTags(dataForSeries.metadata);

		/*
		finalObject = {
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
		*/

		finalObject = {
			studies: [
				{
					...studyTagsDict
				}
			]
		};

		seriesAcc.push({
			...seriesTagsDict,
			...payload
		});

		/*		
		for (let i = 0; i < filteredFiles.length; i++) {
			const file = filteredFiles[i];
			const fileName = getFileName(file.fname);
	
			const urlToFetch = `${PUBLIC_API_URL}uploadedfiles/${file.id}/${fileName}`;
	
			const response = await fetch(urlToFetch, {
				headers: {
					'Content-Type': 'blob',
					Authorization: `Token ${token}`
				}
			});
	
			const blob = await response.blob();
	
			await fetch(`/api/files/${file.fname}`, {
				method: 'POST',
				body: blob,
				headers: {
					'content-type': `${blob.type}`
				}
			});
	
			const merged = await setupReader(blob);
	
			console.log('Merged', merged);
	
			const url = `dicomweb:${PUBLIC_RESOURCES_URL}api/files/ohif/${file.fname}`;
	
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
	
		console.log('Payload', payload);
	
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
	
		const finalObject = {};
	
		await fetch('/api/posts', {
			method: 'POST',
			body: JSON.stringify({ name: folderForJSON, finalObject }),
			headers: {
				'content-type': 'application/json'
			}
		});
		*/
	}

	/*

	await fetch('/api/posts', {
		method: 'POST',
		body: JSON.stringify({ name: folderForJSON, finalObject }),
		headers: {
			'content-type': 'application/json'
		}
	});

	*/

	finalObject.studies[0].series = seriesAcc;

	await fetch('/api/posts', {
		method: 'POST',
		body: JSON.stringify({ name: folderForJSON, finalObject }),
		headers: {
			'content-type': 'application/json'
		}
	});

	return new Response(JSON.stringify({ success: 'true' }));
};

function createDataSet(dataSet: dicomParser.DataSet) {
	// Define a mapping of DICOM element tags to headers and their types
	const dicomTagToHeader: any = {
		x00080020: 'StudyDate',
		x00080030: 'StudyTime',
		x00100010: 'PatientName',
		x00100020: 'PatientID',
		x00080050: 'AccessionNumber',
		x00080061: 'Modalities',
		x00101010: 'PatientAge',
		x00100040: 'PatientSex',
		x00201209: 'NumberOfInstances',
		x00080022: 'Time',
		x00200011: 'SeriesNumber',
		x00180050: { header: 'SliceThickness', type: 'int' },
		x00180088: 'SpacingBetweenSlices',
		x00080031: 'SeriesTime',
		x00180081: 'ViewPosition',

		x00280011: { header: 'Columns', type: 'uint16' },
		x00280010: { header: 'Rows', type: 'uint16' },
		x00200013: { header: 'InstanceNumber', type: 'int' },
		x00080016: 'SOPClassUID',
		x00280004: 'PhotometricInterpretation',
		x00280100: { header: 'BitsAllocated', type: 'uint16' },
		x00280101: { header: 'BitsStored', type: 'uint16' },
		x00280103: { header: 'PixelRepresentation', type: 'uint16' },
		x00280002: { header: 'SamplesPerPixel', type: 'uint16' },
		x00280030: { header: 'PixelSpacing', type: 'array', convert: true },
		x00280102: { header: 'HighBit', type: 'uint16' },
		x00200037: { header: 'ImageOrientationPatient', type: 'array', convert: true },
		x00200032: { header: 'ImagePositionPatient', type: 'array', convert: true },
		x00200052: 'FrameOfReferenceUID',
		x00080008: { header: 'ImageType', type: 'array' },
		x00080060: 'Modality',
		x00080018: 'SOPInstanceUID',
		x0020000e: 'SeriesInstanceUID',
		x0020000d: 'StudyInstanceUID',
		x00281050: { header: 'WindowCenter', type: 'int' },
		x00281051: { header: 'WindowWidth', type: 'int' },
		x00080021: 'SeriesDate'
	};

	// Define the list of DICOM element tags you want to extract
	const dicomElements = Object.keys(dicomTagToHeader);

	// Extract values from the parsed DICOM dataset and store in a dictionary
	const dicomValues: any = {};
	dicomElements.forEach((elementTag) => {
		const tagInfo = dicomTagToHeader[elementTag];
		let value: any;

		if (tagInfo && tagInfo.type === 'uint16') {
			value = dataSet.uint16(elementTag); // Convert to numerical value
		} else if (tagInfo && tagInfo.type === 'int') {
			//@ts-ignore
			value = parseInt(dataSet.string(elementTag));
		} else if (tagInfo && tagInfo.type === 'array') {
			const valueToSplit = dataSet.string(elementTag);
			if (valueToSplit) {
				value = valueToSplit.split('\\');
			}

			if (tagInfo.convert === true && value) {
				value = value.map(Number);
			}
		} else {
			value = dataSet.string(elementTag); // Default: string value
		}

		const header = tagInfo.header ? tagInfo.header : tagInfo;
		dicomValues[header] = value;
	});

	return dicomValues;
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
