type ViewerComponent = 'IFrameDisplay' | 'ImageDisplay' | 'DcmDisplay';

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
