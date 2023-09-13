<script lang="ts">
  export let blob;

  let url = window.URL.createObjectURL(new Blob([blob]));
</script>

<div>
  <img class="max-h-100 max-w-100" src={url} alt="" />
</div>
