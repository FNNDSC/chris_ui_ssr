<script lang="ts">
  export let blob;
  export let fileType: string;

  let fileObj = {};
  let url = "";

  if (fileType === "html") {
    fileObj = {
      type: "text/html",
    };
  }
  
  if (fileType === "pdf") {
    fileObj = {
      type: "application/pdf",
    };
  } else {
    fileObj = {};
  }

  url = window.URL.createObjectURL(new Blob([blob], fileObj));
</script>

{#if url}
  <iframe src={url} width="100%" height="100%" color="white" title="Gallery" />
{:else}
  <div>Loading an iframe</div>
{/if}
