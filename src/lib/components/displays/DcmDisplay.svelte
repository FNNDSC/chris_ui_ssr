<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let blob: Blob;

	let cornerstone: any = null;
	let currentIndex: number;

	function setCurrentIndex(index: number) {
		currentIndex = index;
	}

	onMount(async () => {
		if (browser) {
			try {
				const module = await import('$lib/utilities/cornerstone');
				if (module && cornerstone !== null) {
					const { loadDicomImage, enableElement, initDemo } = module;
					await initDemo();
					const imageId = loadDicomImage(blob);
					enableElement(cornerstone, [imageId], setCurrentIndex);
				}
			} catch (error: any) {
				console.log('Error', error);
			}
		}
	});

	onDestroy(async () => {
		if (browser) {
			const module = await import('$lib/utilities/cornerstone');
			if (module) {
				module.cleanUpTooling();
			}
		}
	});
</script>

<div bind:this={cornerstone} id="container" />
