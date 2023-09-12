<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { Folder, File, X, Download, Trash } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { LibraryCard, NewFolder, Breadcrumb, Input } from '$lib/components/library/';
	import { Button } from '$lib/components/ui/button';
	import { Dialog, DialogContent } from '$lib/components/ui/dialog';
	import {
		handleUpload,
		handleFileDownload,
		handleFolderDownload,
		handleFileDelete,
		handleFolderDelete,
		handleOhif,
		createNewFolder,
		getFileName,
		getCurrentlyActive
	} from '$lib/utilities/library';
	import { downloadStore } from '$lib/stores/downloadStore';
	import { uploadStore } from '$lib/stores/uploadStore';
	import type { PageData } from './$types';
	import type { PreviewPayload } from '$lib/types/Library';

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
				const file = {
					fname: selected.path.substring(9)
				};
				dispatchFileActions(action, file);
			}
		});
	}

	async function dispatchFileActions(action: string, file: any, currentIndex?: number) {
		switch (action) {
			case 'Download': {
				handleFileDownload(file, data.token);
				break;
			}

			case 'Delete': {
				handleFileDelete(file, data.token);
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
				console.log('OHIF', file);
			}

			default:
				return;
		}
	}

	async function dispatchFolderActions(action: string, folder: any, currentIndex?: number) {
		switch (action) {
			case 'Download': {
				handleFolderDownload(folder, data.token);
				break;
			}
			case 'Delete': {
				handleFolderDelete(folder, data.token);
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
				const newWindow = window.open('http://localhost:5173/ohif', '_blank');

				const response = await handleOhif(folder, data.token);

				if (response.status === 200) {
					if (newWindow)
						newWindow.location = `http://192.168.0.197:3002/viewer/dicomjson?url=http://192.168.0.197:5173/api/posts/${folder.name}.json`;
				}
			}
		}
	}

	function handleFolderChange(e: any) {
		const folder = e.target.files;
		handleUpload(folder, true, currentPath, data.token);
	}

	function handleFileChange(e: any) {
		const files = e.target.files;
		handleUpload(files, false, currentPath, data.token);
	}

	async function createFolder() {
		if (!newFolder) {
			newFolder = 'Untitled';
		}

		createNewFolder(newFolder, currentPath, data.token);
		openDialog = !openDialog;
		newFolder = '';
	}
</script>

{#if open}
	<Dialog bind:open closeOnEscape={false} closeOnOutsideClick={false}>
		<DialogContent class="h-full sm:max-w-full">
			{#if browser}
				<svelte:component
					this={Carousel}
					{files}
					{previewPayload}
					token={data.token}
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

<div class="grid gap-4 sm:grid-cols-1 lg:grid-cols-5">
	{#each folders as folder, index (folder.name)}
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

	{#each files as file, index (file.fname)}
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
</div>