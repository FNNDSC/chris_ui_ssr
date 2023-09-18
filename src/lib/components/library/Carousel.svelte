<script lang="ts">
  import { onMount } from "svelte";
  import type { PreviewPayload } from "$lib/types/Library";
  import {
    DcmDisplay,
    ImageDisplay,
    IFrameDisplay,
  } from "$components/displays";
  import { Button } from "$lib/components/ui/button";
  import {
    fetchFile,
    getFileExtension,
    fileViewerMap,
  } from "$lib/utilities/library";
  import type { File } from "$lib/types/Library";

  export let token: string;
  export let previewPayload: PreviewPayload;
  export let files: File[];
  export let dispatchFileActions: (
    action: string,
    file: any,
    currentIndex?: number
  ) => void;

  const components: any = {
    DcmDisplay,
    ImageDisplay,
    IFrameDisplay,
  };

  let ViewerType: any;
  let fileBlob: Blob;
  let fileExtension: string;

  async function fetchData(fname: string, token: string, type: string) {
    const fileData = await fetchFile(fname, token, type);
    let fileBlob: Blob;
    let fileExtension: string;

    if (type === "file") {
      fileBlob = await fileData.getFileBlob();
      fileExtension = getFileExtension(fname);
    } else {
      const middle = Math.floor(fileData.length / 2);
      const chosenFile = fileData[middle];
      fileBlob = await chosenFile.getFileBlob();
      fileExtension = getFileExtension(chosenFile.data.fname);
    }

    return {
      blob: fileBlob,
      fileExtension,
    };
  }

  async function setViewer(fname: string, type: string) {
    const data = await fetchData(fname, token, type);
    ViewerType = fileViewerMap[data.fileExtension];
    fileBlob = data.blob;
    fileExtension = data.fileExtension;
  }

  onMount(async () => {
    const { payload } = previewPayload;

    if (previewPayload.type === "file") {
      setViewer(payload.fname, "file");
    }

    if (previewPayload.type === "folder") {
      setViewer(`${payload.path}/${payload.name}`, "folder");
    }
  });

  function loadNext() {
    const { currentIndex } = previewPayload;

    if (currentIndex !== undefined) {
      const file = files[currentIndex + 1];
      dispatchFileActions("Preview", file, currentIndex + 1);
    }
  }

  function loadPrevious() {
    const { currentIndex } = previewPayload;
    if (currentIndex !== undefined) {
      const file = files[currentIndex - 1];
      dispatchFileActions("Preview", file, currentIndex - 1);
    }
  }

  $: if (previewPayload.type === "file") {
    setViewer(previewPayload.payload.fname, "file");
  }
  
</script>

{#if !ViewerType}
  <div>Loading a viewer for this file type</div>
{:else}
  {#if previewPayload.type === "file"}
    <Button
      on:click={loadPrevious}
      class="top-4 left-4 absolute z-40"
      variant="ghost">Load Previous</Button
    >

    <Button
      on:click={loadNext}
      class="top-4 right-10 absolute z-40"
      variant="ghost">Load Next</Button
    >
  {/if}

  <svelte:component
    this={components[ViewerType]}
    fileType={fileExtension}
    blob={fileBlob}
  />
{/if}
