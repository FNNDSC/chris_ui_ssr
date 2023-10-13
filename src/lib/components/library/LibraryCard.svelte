<script lang="ts">
	import { goto } from '$app/navigation';
	import { Ellipse } from '$lib/components/library';
	import { Card } from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Download } from 'lucide-svelte';

	export let data: {
		active: boolean;
		path: string;
		type: string;
		multipleSelected: { path: string; type: string }[];
	};

	export let handleMultipleSelect: (path: string, multiple: boolean, type: string) => void;
	export let handleAction: (action: string) => void;

	let clickCount = 0;
	let singleClickTimer: any;
	let actions = ['Delete', 'Preview', 'Zip', 'OHIF', 'Export'];

	$: ({ active, path, type, multipleSelected } = data);
	$: selected = multipleSelected.find((selected) => selected.path === path);

	function handleClicks(e: MouseEvent) {
		e.preventDefault();
		clickCount++;

		if (clickCount === 1) {
			singleClickTimer = setTimeout(function () {
				clickCount = 0;

				if (e.ctrlKey) {
					handleMultipleSelect(path, true, type);
				} else {
					handleMultipleSelect(path, false, type);
				}
			}, 400);
		} else if (clickCount === 2) {
			clearTimeout(singleClickTimer);
			clickCount = 0;
			if (type === 'folder') {
				goto(path);
			}
			if (type === 'file') {
				handleAction('Preview');
			}
		}
	}
</script>

<Card
	class="relative flex items-center px-6 py-5 hover:border-gray-200 
  {selected && 'border-gray-200'}
"
>
	{#if active}
		<span
			class="absolute top-0 right-0 -mr-1 -mt-1 w-2 h-2 rounded-full bg-purple-400 animate-ping"
		/>
	{/if}

	<slot name="icon" />
	<div class="min-w-0 flex-1">
		<a href={type === 'folder' ? path : ''} on:click={handleClicks} class="focus:outline-none">
			<span class="absolute inset-0" aria-hidden="true" />
			<span class="flex items-center">
				<slot name="name" />
			</span>
		</a>
	</div>
	<div class="relative ml-auto">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500"
				id="options-menu-0-button"
				aria-expanded="false"
				aria-haspopup="true"
			>
				<span class="sr-only">Open options</span>
				<Ellipse />
			</DropdownMenu.Trigger>

			<DropdownMenu.Content>
				<DropdownMenu.Group>
					{#each actions as action (action)}
						<DropdownMenu.Item
							on:click={() => {
								handleAction(action);
							}}
						>
							{#if action === 'Zip' && type === 'file'}
								Download
							{:else if action === 'Zip' && type === 'folder'}
								Zip and Download
							{:else}
								{action}
							{/if}
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
					{/each}
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div></Card
>
