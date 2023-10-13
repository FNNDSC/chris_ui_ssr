<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { Folder, File, X, Download, Trash, LucideMonitor } from 'lucide-svelte';
	import { LibraryCard, NewFolder, Breadcrumb, Input } from '$lib/components/library/';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import {
		handleUpload,
		handleFileExport,
		handleFolderExport,
		handleFileDelete,
		handleFolderDelete,
		handleOhif,
		createNewFolder,
		getFileName,
		getCurrentlyActive,
		getFolderForJSON,
		handleZipFolderDownload,
		handleZipDownloadFile
	} from '$lib/utilities/library';
	import { downloadStore } from '$lib/stores/downloadStore';
	import { uploadStore } from '$lib/stores/uploadStore';
	import type { PageData } from './$types';
	import type { PreviewPayload } from '$lib/types/Library';
	import type { FolderType, FileType } from '$lib/types/Data';
	import { fetchClient } from '$lib/client';
	import { getLibraryResources } from '$lib/api/library';
	import { afterNavigate } from '$app/navigation';

	export let data: PageData;

	let openDialog = false;
	let open = false;
	let previewPayload: PreviewPayload = {
		type: '',
		payload: undefined,
		currentIndex: undefined
	};

	let fileInput: any;
	let folderInput: any;
	let newFolder: string;
	let multipleSelected: {
		path: string;
		type: string;
	}[] = [];
	let Carousel: any;
	let next: string | null;

	$: pathname = $page.url.pathname;
	$: currentPath = pathname.substring(5);
	$: ({ folders, files } = data);

	onMount(async () => {
		if (browser) {
			const module = (await import('$lib/components/library/Carousel.svelte')).default;
			Carousel = module;
		}
	});

	function handleMultipleSelect(path: string, multiple: boolean, type: string) {
		const findIndex = multipleSelected.find((selected) => selected.path === path);

		if (findIndex) {
			multipleSelected = multiple
				? multipleSelected.filter((existingPath) => existingPath.path !== path)
				: [];
		} else {
			multipleSelected = multiple ? [...multipleSelected, { path, type }] : [{ path, type }];
		}
	}

	function clearSelected() {
		multipleSelected = [];
	}

	function handleMultipleAction(action: string) {
		multipleSelected.map((selected) => {
			if (selected.type === 'folder') {
				const folder = {
					name: getFileName(selected.path),
					path: selected.path.substring(9)
				};
				dispatchFolderActions(action, folder);
			}

			if (selected.type === 'file') {
				const file: FileType = {
					creation_date: '',
					fname: selected.path.substring(9),
					fsize: 0
				};

				dispatchFileActions(action, file);
			}
		});
	}

	async function dispatchFileActions(action: string, file: FileType, currentIndex?: number) {
		switch (action) {
			case 'Export': {
				handleFileExport(file);
				break;
			}

			case 'Delete': {
				handleFileDelete(file, data.user.token, data.user.cubeurl);
				break;
			}

			case 'Zip': {
				handleZipDownloadFile(file, data.user.token);
				break;
			}

			case 'Preview': {
				open = true;
				previewPayload['type'] = 'file';
				previewPayload['payload'] = file;
				previewPayload['currentIndex'] = currentIndex;
				break;
			}

			case 'OHIF': {
				const folderForJSON = getFolderForJSON(file.fname);
				const newWindow = window.open(`${$page.url.origin}/ohif`, '_blank');

				const response = await handleOhif(file.fname, folderForJSON, 'file', file);

				if (response.status === 200) {
					if (newWindow)
						newWindow.location = `${env.PUBLIC_OHIF_URL}viewer/dicomjson?url=${$page.url.origin}/api/jsonfile/${folderForJSON}.json`;
				}
				break;
			}

			default:
				break;
		}
	}

	async function dispatchFolderActions(action: string, folder: FolderType, currentIndex?: number) {
		switch (action) {
			case 'Export': {
				handleFolderExport(folder);
				break;
			}
			case 'Delete': {
				handleFolderDelete(folder, data.user.token, data.user.cubeurl);
				break;
			}

			case 'Zip': {
				handleZipFolderDownload(folder, data.user.token, data.user.cubeurl);
				break;
			}

			case 'Preview': {
				open = true;
				previewPayload['type'] = 'folder';
				previewPayload['payload'] = folder;
				previewPayload['currentIndex'] = currentIndex;
				break;
			}

			case 'OHIF': {
				const newWindow = window.open(`${$page.url.origin}/ohif`, '_blank');
				const response = await handleOhif(`${folder.path}/${folder.name}`, folder.name, 'folder');
				if (response.status === 200) {
					if (newWindow)
						newWindow.location = `${env.PUBLIC_OHIF_URL}viewer/dicomjson?url=${$page.url.origin}/api/jsonfile/${folder.name}.json`;
				}
				break;
			}
			default:
				break;
		}
	}

	function handleFolderChange(event: Event) {
		const inputElement = event.target as HTMLInputElement;
		const folder = inputElement.files;
		if (folder) {
			handleUpload(folder, true, currentPath, data.user.token, data.user.cubeurl);
		}
	}

	function handleFileChange(event: Event) {
		const inputElement = event.target as HTMLInputElement;
		const files = inputElement.files;
		if (files) {
			handleUpload(files, false, currentPath, data.user.token, data.user.cubeurl);
		}
	}

	async function createFolder() {
		if (!newFolder) {
			newFolder = 'Untitled';
		}

		createNewFolder(newFolder, currentPath, data.user.token, data.user.cubeurl);
		openDialog = !openDialog;
		newFolder = '';
	}

	let viewport: HTMLDivElement;
	let results: HTMLDivElement;
	let item_width: number;
	let item_height: number;
	let num_columns: number;
	let a = 0;
	$: b = data.totalCount || 30;
	let padding_top = 0;
	let padding_bottom = 0;

	function handleResize() {
		const first = results.children[0] as HTMLDivElement;

		if (first) {
			item_width = first.offsetWidth;
			item_height = first.offsetHeight;

			num_columns = Number(getComputedStyle(results).getPropertyValue('--columns'));
			handleScroll();
		}
	}

	async function handleScroll() {
		const { scrollHeight, scrollTop, clientHeight } = viewport;
		const remaining = scrollHeight - (scrollTop + clientHeight);
		if (remaining < 200) {
			if (!data.nextPage) return;

			const client = fetchClient(data.user.token, data.user.cubeurl);
			const offset = data.offset + data.limit;
			const response = await getLibraryResources(client, currentPath, offset);
			data.folders = [...data.folders, ...response.folders];
			data.files = [...data.files, ...response.files];
			data.offset = response.offset;
			data.nextPage = response.nextPage;
		}

		a = Math.floor(scrollTop / item_height) * num_columns;
		b = Math.ceil((scrollTop + clientHeight) / item_height) * num_columns;

		padding_top = Math.floor(a / num_columns) * item_height;
		padding_bottom = Math.floor((data.totalCount - b) / num_columns) * item_height;
	}

	onMount(handleResize);

	afterNavigate(() => {
		viewport.scrollTo(0, 0);
	});
</script>

{#if open}
	<Dialog bind:open closeOnEscape={false} closeOnOutsideClick={false}>
		<DialogContent class="h-full sm:max-w-full">
			{#if browser && Carousel}
				<svelte:component
					this={Carousel}
					{files}
					{previewPayload}
					token={data.user.token}
					{dispatchFileActions}
				/>
			{/if}
		</DialogContent>
	</Dialog>
{/if}

<div class="flex h-8 mb-2 items-center">
	{#if multipleSelected.length > 0}
		<Button class="mr-4" on:click={clearSelected} variant="outline">
			<X class="h4 w-4" />
		</Button>

		<span class="mr-4">{multipleSelected.length} selected</span>
		<Button on:click={() => handleMultipleAction('Download')} variant="outline">
			<Download class="h4 w-4 cursor-pointer" />
		</Button>

		<Button on:click={() => handleMultipleAction('Delete')} variant="outline">
			<Trash class="h-4 w-4 cursor-pointer" />
		</Button>
	{/if}
</div>

<NewFolder
	handleDialogToggle={() => {
		openDialog = !openDialog;
	}}
	bind:open={openDialog}
	bind:value={newFolder}
	handleSave={createFolder}
/>

<Button
	variant="secondary"
	on:click={() => {
		fileInput.click();
	}}>Upload Files</Button
>

<Button
	variant="secondary"
	on:click={() => {
		folderInput.click();
	}}>Upload Folder</Button
>

<input
	bind:this={fileInput}
	on:change={handleFileChange}
	multiple={true}
	style="display:none"
	type="file"
/>

<Input bind:folderInput {handleFolderChange} style="display:none" type="file" webkitdirectory />

<Breadcrumb currentUrl={pathname} {currentPath} />

<svelte:window on:resize={handleResize} />

<div bind:this={viewport} class="viewport" on:scroll={handleScroll}>
	<div
		bind:this={results}
		style:padding_top="{padding_top}px"
		style:padding_bottom="{padding_bottom}px"
		class="results"
	>
		{#each folders.slice(a, b) as folder, index (folder.name)}
			<LibraryCard
				data={{
					active: getCurrentlyActive(folder.name, $downloadStore, $uploadStore),
					type: 'folder',
					multipleSelected,
					path: `${pathname}/${folder.name}`
				}}
				{handleMultipleSelect}
				handleAction={(action) => dispatchFolderActions(action, folder, index)}
			>
				<Folder class="mr-2" slot="icon" />
				<p slot="name" class="text-sm truncate font-medium text-white">
					{folder.name}
				</p>
			</LibraryCard>
		{/each}

		{#each files.slice(a, b) as file, index (file.fname)}
			<LibraryCard
				data={{
					active: getCurrentlyActive(getFileName(file.fname), $downloadStore, $uploadStore),
					type: 'file',
					multipleSelected,
					path: `${pathname}/${getFileName(file.fname)}`
				}}
				{handleMultipleSelect}
				handleAction={(action) => dispatchFileActions(action, file, index)}
			>
				<File class="mr-2" slot="icon" />
				<p slot="name" class="text-sm truncate font-medium text-white">
					{getFileName(file.fname) || ''}
				</p>
			</LibraryCard>
		{/each}
		{#if next}
			<a href={next}>Next Page</a>
		{/if}
	</div>
</div>

<style>
	.viewport {
		overflow-y: auto;
	}

	.results {
		--columns: 2;
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
	}

	@media (min-width: 30rem) {
		.results {
			--columns: 3;
		}
	}

	@media (min-width: 40rem) {
		.results {
			--columns: 3;
		}
	}

	@media (min-width: 50rem) {
		.results {
			--columns: 3;
		}
	}

	@media (min-width: 60rem) {
		.results {
			--columns: 4;
		}
	}
</style>
