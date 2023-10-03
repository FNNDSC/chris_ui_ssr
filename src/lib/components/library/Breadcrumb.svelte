<script lang="ts">
  import Home from "./HomeIcon.svelte";
  import Path from "./PathIcon.svelte";
 
  export let currentPath: string;
  export let currentUrl: string;

  $: navigation = currentPath.split("/");

  function getCurrentLink(link: string) {
    const currentUrlArray = currentUrl.split("/");
    const newIndex = currentUrlArray.findIndex((url) => url === link);
    const newUrl = currentUrlArray.slice(0, newIndex + 1);
    return newUrl.join("/");
  }

  function getHomeLink() {
    const homeLink = currentUrl.split("/").slice(0, 4);
    return homeLink.join("/");
  }
</script>

<nav class="flex mt-8 mb-4" aria-label="Breadcrumb">
  <ol class="flex items-center space-x-4">
    <li>
      <div>
        <a href={getHomeLink()} class="text-gray-400 hover:text-gray-200">
          <Home />
        </a>
      </div>
    </li>
    {#each navigation as link, i}
      {#if i > 1}
        <li>
          <div class="flex items-center">
            <Path />
            <a
              href={getCurrentLink(link)}
              class="ml-4 text-sm font-medium text-gray-400 hover:text-gray-200"
              >{link}</a
            >
          </div>
        </li>{/if}
    {/each}
  </ol>
</nav>
