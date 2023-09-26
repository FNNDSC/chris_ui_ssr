import { error } from '@sveltejs/kit';
import module from 'dicom-parser';
import type Client from '@fnndsc/chrisapi';
import { fetchClient } from '$lib/client.js';
import { getFileName } from '$lib/utilities/library/index.js';
import type { FileType } from '$lib/types/Data/index.js';
import { env } from '$env/dynamic/public';

async function setupReader(blob: Blob) {
	try {
		const buffer = Buffer.from(await blob.arrayBuffer());
		const bufferArray = new Uint8Array(buffer);
		const dataSet = module.parseDicom(bufferArray);
		const dictionary = createDataSet(dataSet);
		return dictionary;
	} catch (error) {
		console.log('Error', error);
	}
}

async function getFileForPath(path: string, client: Client) {
	const pathList = await client.getFileBrowserPath(path);
	const files = await pathList.getFiles({ limit: 100000 });
	return files;
}

async function recursivelyOrganizeFiles(path: string, token: string, recursivePath: any) {
	const client = fetchClient(token);

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
				await recursivelyOrganizeFiles(computedPath, token, recursivePath);
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

type DicomValue = Record<string, string | number | number[] | string[] | undefined>;

interface PayloadInstance {
	url: string;
	metadata: DicomValue;
}

type DicomTagType = 'string' | 'int' | 'uint16' | 'array';

interface DicomTagValue {
	header: string;
	type: DicomTagType;
	convert?: boolean;
}

type DicomTagMap = Record<string, string | DicomTagValue>;

type Study = DicomValue & { series: SeriesValue[] };

type StudyAccumulator = {
	[key: string]: Study;
};

type SeriesValue = DicomValue | { instances: PayloadInstance[] };

type SeriesAccumulator = {
	[key: string]: SeriesValue;
};

type Studies = Study[];

export const POST = async ({ request, fetch }) => {
	const data = await request.json();

	const { path, token, folderForJSON, type, file } = data;

	const recursivePath: { [key: string]: FileType[] } = {};

	if (type === 'folder') {
		await recursivelyOrganizeFiles(path, token, recursivePath);
	} else if (type === 'file') {
		recursivePath[path] = [file];
	}

	const studiesAcc: StudyAccumulator = {};
	const seriesAcc: SeriesAccumulator = {};
	const studies: Studies = [];

	for (const path in recursivePath) {
		const payload: { instances: PayloadInstance[] } = {
			instances: []
		};
		const files = recursivePath[path];

		for (let i = 0; i < files.length; i++) {
			const file: FileType = files[i];

			const client = fetchClient(token);

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

				try {
					await fetch(`/api/files/${fname}`, {
						method: 'POST',
						body: blob,
						headers: {
							'content-type': `${blob.type}`
						}
					});
				} catch (errorMessage) {
					throw error(400, {
						message: errorMessage as string
					});
				}

				const merged = await setupReader(blob);

				const url = `dicomweb:${env.PUBLIC_RESOURCES_URL}api/files/ohif/${fname}`;

				payload['instances'].push({
					url: url,
					metadata: merged
				});
			} catch (errorMessage) {
				throw error(500, {
					message: errorMessage as string
				});
			}
		}

		try {
			const data = payload.instances[0].metadata;

			const studyDict = studyTags(data, payload.instances.length);
			const seriesDict = seriesTags(data);
			const studyID = studyDict['StudyInstanceUID'] as string;
			const seriesID = seriesDict['SeriesInstanceUID'] as string;

			//Accumulate all the studies
			studiesAcc[studyID] = { ...studyDict, series: [] };

			//Accumulate all the series
			const seriesEntry: DicomValue | { instances: PayloadInstance[] } = {
				...seriesDict,
				...payload
			};

			seriesAcc[seriesID] = seriesEntry;
		} catch (errorMessage) {
			throw error(500, {
				message: errorMessage as string
			});
		}
	}

	for (const series in seriesAcc) {
		const presentSeries = seriesAcc[series];

		if ('StudyInstanceUID' in presentSeries) {
			const studyID: string = presentSeries.StudyInstanceUID as string;

			if (studiesAcc[studyID]) {
				studiesAcc[studyID].series.push(presentSeries);
			}
		}
	}

	for (const study in studiesAcc) {
		const presentStudy = studiesAcc[study];
		studies.push(presentStudy);
	}

	const finalObject = {
		studies
	};

	try {
		const response = await fetch('/api/jsonfile', {
			method: 'POST',
			body: JSON.stringify({ name: folderForJSON, finalObject }),
			headers: {
				'content-type': 'application/json'
			}
		});
		return response;
	} catch (errorMessage) {
		throw error(404, {
			message: errorMessage as string
		});
	}
};

function createDataSet(dataSet: dicomParser.DataSet) {
	// Define a mapping of DICOM element tags to headers and their types
	const dicomTagToHeader: DicomTagMap = {
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
	const dicomValues: DicomValue = {};

	dicomElements.forEach((elementTag) => {
		const tagInfo = dicomTagToHeader[elementTag];
		let value: string | number | string[] | number[] | undefined;

		if (typeof tagInfo === 'string') {
			value = dataSet.string(elementTag);
		} else if (typeof tagInfo === 'object' && tagInfo.type === 'uint16') {
			value = dataSet.uint16(elementTag); // Convert to numerical value
		} else if (typeof tagInfo === 'object' && tagInfo.type === 'int') {
			const stringValue = dataSet.string(elementTag);
			value = stringValue ? parseInt(stringValue) : undefined;
		} else if (tagInfo && tagInfo.type === 'array') {
			const valueToSplit = dataSet.string(elementTag);
			if (valueToSplit) {
				value = valueToSplit.split('\\');
			}
			if (tagInfo.convert === true && Array.isArray(value)) {
				value = value.map(Number);
			}
		}

		const header = typeof tagInfo === 'string' ? tagInfo : tagInfo.header;
		dicomValues[header] = value;
	});

	return dicomValues;
}

function studyTags(metaData: DicomValue, numOfInstances: number) {
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

function seriesTags(
	metaData: DicomValue
): Record<keyof DicomValue, string | number | number[] | string[] | undefined> {
	return {
		StudyInstanceUID: metaData['StudyInstanceUID'],
		SeriesDescription: metaData['SeriesDescription'] || '',
		SeriesInstanceUID: metaData['SeriesInstanceUID'] || '',
		SeriesNumber: metaData['SeriesNumber'] || '',
		SeriesDate: metaData['SeriesDate'] || '',
		SeriesTime: metaData['SeriesTime'] || '',
		Modality: metaData['Modality'] || '',
		SliceThickness: metaData['SliceThickness'] || ''
	};
}
