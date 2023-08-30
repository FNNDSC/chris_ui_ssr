<script lang="ts">
  import type { InputProps } from "$lib/types/Library";

  export let handleFolderChange: (e: any) => void;
  export let folderInput: any;

  interface $$Props extends InputProps {
    webkitdirectory: boolean;
    folderInput: any;
    handleFolderChange: (e: any) => void;
  }
</script>

<input
  bind:this={folderInput}
  on:change={handleFolderChange}
  {...$$restProps}
/>
