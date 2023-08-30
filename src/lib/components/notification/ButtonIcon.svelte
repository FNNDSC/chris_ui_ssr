<script lang="ts">
  import { FileIcon, FolderIcon } from "lucide-svelte";
  import { createEventDispatcher } from "svelte";

  export let text: string;
  export let iconType: string;
  
  const dispatch = createEventDispatcher();

  function onClick() {
    dispatch("close");
  }
</script>

<button
  on:click={onClick}
  type="button"
  class="inline-flex rounded-md text-gray-500 hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
>
  <span class="sr-only">{text}</span>
  {#if iconType === "close"}
    <svg
      class="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
      />
    </svg>
  {/if}

  {#if iconType === "folder"}
    <FolderIcon class="h-5 w-5" />
  {/if}

  {#if iconType === "file"}
    <FileIcon class="h-5 w-5" />
  {/if}
</button>
