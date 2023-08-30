<script lang="ts">
  import { browser } from "$app/environment";
  import Button from "$components/ui/button/Button.svelte";
  import { onMount } from "svelte";

  export let imageIds: string[];
  export let loadMoreFiles: () => void;

  let cornerstone: any;
  let showMessage = false;
  let module: any;
  let currentImageIndex: number;

  function setCurrentIndex(index: number) {
    currentImageIndex = index;
  }

  $: {
    if (module) {
      const { setViewport } = module;
      setViewport(imageIds, setCurrentIndex);
    }
  }

  onMount(async () => {
    if (browser) {
      module = await import("$lib/utilities/cornerstone");
      const { enableElement } = module;
     
      enableElement(cornerstone, imageIds, setCurrentIndex);
    }
  });
</script>

<div class="top-4 left-4 absolute z-10">
  {#if true}
    <Button on:click={loadMoreFiles} variant="outline">
      Click here to load more files</Button
    >
    {currentImageIndex + 1}/{imageIds.length}
  {/if}
</div>

<div
  on:wheel={() => {
    if (!showMessage) showMessage = true;
    return;
  }}
  bind:this={cornerstone}
  id="container"
/>
