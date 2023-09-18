import type { FolderType, FileType } from '../Data';

type ViewerComponent =
	| 'IFrameDisplay'
	| 'PdfDisplay'
	| 'JsonDisplay'
	| 'ImageDisplay'
	| 'DcmDisplay'
	| 'CatchallDisplay'
	| 'NiftiDisplay'
	| 'XtkDisplay';

export type FileViewerType = Record<string, ViewerComponent>;

export interface InputProps {
	style: string;
	type: string;
}

export interface PreviewPayload {
	type: string;
	payload?: any;
	currentIndex?: number;
}
