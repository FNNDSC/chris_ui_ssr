import {
	getRenderingEngine,
	getConfiguration,
	init as csRenderInit,
	RenderingEngine,
	type Types
} from '@cornerstonejs/core';
import * as cornerstone from '@cornerstonejs/core';
import {
	addTool,
	removeTool,
	PanTool,
	WindowLevelTool,
	StackScrollMouseWheelTool,
	ZoomTool,
	PlanarRotateTool,
	ToolGroupManager
} from '@cornerstonejs/tools';
import dicomParser from 'dicom-parser';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import cornerstoneFileImageLoader from 'cornerstone-file-image-loader';
import { init as csToolsInit } from '@cornerstonejs/tools';
import { ViewportType } from '@cornerstonejs/core/dist/esm/enums';

const { preferSizeOverAccuracy, useNorm16Texture } = getConfiguration().rendering;

export default function initCornerstoneDICOMImageLoader() {
	cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
	cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
	cornerstoneDICOMImageLoader.configure({
		useWebWorkers: true,
		decodeConfig: {
			convertFloatPixelDataToInt: false,
			use16BitDataType: preferSizeOverAccuracy || useNorm16Texture
		}
	});

	let maxWebWorkers = 1;

	if (navigator.hardwareConcurrency) {
		maxWebWorkers = Math.min(navigator.hardwareConcurrency, 7);
	}

	const config = {
		maxWebWorkers,
		startWebWorkersOnDemand: false,
		taskConfiguration: {
			decodeTask: {
				initializeCodecsOnStartup: false,
				strict: false
			}
		}
	};

	cornerstoneDICOMImageLoader.webWorkerManager.initialize(config);
}

// Instantiate a rendering engine
const renderingEngineId = 'myRenderingEngine';
const viewportId = 'CT_STACK';
const toolGroupId = 'STACK_TOOL_GROUP_ID';
const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

function initTools() {
	addTool(PanTool);
	addTool(WindowLevelTool);
	addTool(StackScrollMouseWheelTool);
	addTool(ZoomTool);
	addTool(PlanarRotateTool);

	if (toolGroup) {
		// Add tools to the tool group
		toolGroup.addTool(WindowLevelTool.toolName);
		toolGroup.addTool(PanTool.toolName);
		toolGroup.addTool(ZoomTool.toolName);
		toolGroup.addTool(StackScrollMouseWheelTool.toolName, { loop: true });
		toolGroup.addTool(PlanarRotateTool.toolName);
	}
}

export function cleanUpTooling() {
	if (toolGroup) {
		removeTool(PanTool);
		removeTool(WindowLevelTool);
		removeTool(StackScrollMouseWheelTool);
		removeTool(ZoomTool);
		removeTool(PlanarRotateTool);
	}
}

export async function initDemo() {
	initCornerstoneDICOMImageLoader();
	await csRenderInit();
	await csToolsInit();
}

export function loadDicomImage(blob: Blob) {
	return cornerstoneDICOMImageLoader.wadouri.fileManager.add(blob);
}

export function loadImage(blob: Blob) {
	return cornerstoneFileImageLoader.fileManager.add(blob);
}

export async function enableElement(
	element: any,
	imageIds: string[],
	currentIndex: (index: number) => void
) {
	initTools();
	const renderingEngine = new RenderingEngine(renderingEngineId);
	// Create a stack viewport
	const viewportInput = {
		viewportId,
		element,
		type: ViewportType.STACK
	};

	renderingEngine.enableElement(viewportInput);
	toolGroup && toolGroup.addViewport(viewportId, renderingEngineId);

	await setViewport(imageIds, currentIndex);
}

let lastIndex = 0;

export async function setViewport(imageIds: string[], currentIndex: (index: number) => void) {
	const renderingEngine = getRenderingEngine(renderingEngineId);

	if (renderingEngine) {
		// Get the stack viewport that was created
		const viewport = <Types.IStackViewport>renderingEngine.getViewport(viewportId);

		const index = viewport.getCurrentImageIdIndex();
		lastIndex = index;
		currentIndex(index);

		// Set the stack on the viewport
		await viewport.setStack(imageIds, lastIndex);

		// Render the image
		viewport.render();
		toolGroup && toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
	}
}
