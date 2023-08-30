<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";

  export let blob: Blob;

  let cornerstone: any;
  let currentIndex: number;

  function setCurrentIndex(index: number) {
    currentIndex = index;
  }

  async function setDicom(blob: Blob) {
    if (browser) {
      const module = await import("$lib/utilities/cornerstone");
      const { loadDicomImage, enableElement } = module;

      const imageId = loadDicomImage(blob);
      enableElement(cornerstone, [imageId], setCurrentIndex);
    }
  }

  onMount(async () => {
    if (browser) {
      const module = await import("$lib/utilities/cornerstone");
      const { initDemo } = module;
      await initDemo();
      setDicom(blob);
    }
  });

  onDestroy(async () => {
    if (browser) {
      const module = await import("$lib/utilities/cornerstone");
      module.cleanUpTooling();
    }
  });

  $: setDicom(blob);
</script>

<div bind:this={cornerstone} id="container" />
