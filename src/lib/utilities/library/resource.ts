const finalObject = {
	studies: [
		{
			StudyInstanceUID: '1.3.6.1.4.1.14519.5.2.1.6279.6001.298806137288633453246975630178',
			StudyDate: '20000101',
			StudyTime: '',
			PatientName: 'Doe^Anonymized',
			PatientID: 'LIDC-IDRI-0001',
			AccessionNumber: '',
			PatientAge: '',
			PatientSex: '',
			series: [
				{
					SeriesInstanceUID: '1.3.6.1.4.1.14519.5.2.1.6279.6001.179049373636438705059720603192',
					SeriesNumber: 3000566,
					Modality: 'CT',
					SliceThickness: 2.5,
					instances: [
						{
							metadata: {
								Columns: 512,
								Rows: 512,
								InstanceNumber: 1,
								SOPClassUID: '1.2.840.10008.5.1.4.1.1.2',
								PhotometricInterpretation: 'MONOCHROME2',
								BitsAllocated: 16,
								BitsStored: 16,
								PixelRepresentation: 1,
								SamplesPerPixel: 1,
								PixelSpacing: [0.703125, 0.703125],
								HighBit: 15,
								ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
								ImagePositionPatient: [-166, -171.699997, -10],
								FrameOfReferenceUID:
									'1.3.6.1.4.1.14519.5.2.1.6279.6001.229925374658226729607867499499',
								ImageType: ['ORIGINAL', 'PRIMARY', 'AXIAL'],
								Modality: 'CT',
								SOPInstanceUID: '1.3.6.1.4.1.14519.5.2.1.6279.6001.262721256650280657946440242654',
								SeriesInstanceUID:
									'1.3.6.1.4.1.14519.5.2.1.6279.6001.179049373636438705059720603192',
								StudyInstanceUID:
									'1.3.6.1.4.1.14519.5.2.1.6279.6001.298806137288633453246975630178',
								WindowCenter: -600,
								WindowWidth: 1600,
								SeriesDate: '20000101'
							},
							url: 'dicomweb:http://http://192.168.0.197:5173/api/uploadedfiles/test'
						}
					]
				}
			],
			NumInstances: 133,
			Modalities: 'CT'
		}
	]
};

export default finalObject;
