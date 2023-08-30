<script lang="ts">
  import Transition from "svelte-transition";
  import { createMenu } from "svelte-headlessui";
  import { goto } from "$app/navigation";
  import { Card } from "$lib/components/ui/card";
  import Ellipse from "./Ellipse.svelte";

  export let data: {
    active: boolean;
    path: string;
    type: string;
    multipleSelected: { path: string; type: string }[];
  };

  export let handleMultipleSelect: (
    path: string,
    multiple: boolean,
    type: string
  ) => void;
  export let handleAction: (action: string) => void;

  let clickCount = 0;
  let singleClickTimer: any;
  let actions = ["Download", "Delete", "Preview", "OHIF"];

  $: ({ active, path, type, multipleSelected } = data);
  $: selected = multipleSelected.find((selected) => selected.path === path);

  const menu = createMenu({
    label: "Actions",
  });

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
      if (type === "folder") {
        goto(path);
      }
      if (type === "file") {
        handleAction("Preview");
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
    <a
      href={type === "folder" ? path : ""}
      on:click={handleClicks}
      class="focus:outline-none"
    >
      <span class="absolute inset-0" aria-hidden="true" />
      <span class="flex items-center">
        <slot name="name" />
      </span>
    </a>
  </div>
  <div class="relative ml-auto">
    <button
      use:menu.button
      type="button"
      class="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500"
      id="options-menu-0-button"
      aria-expanded="false"
      aria-haspopup="true"
    >
      <span class="sr-only">Open options</span>
      <Ellipse />
    </button>

    <Transition
      show={$menu.expanded}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <div
        use:menu.items
        class="absolute right-0 z-10 ml-4 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu-0-button"
        tabindex="-1"
      >
        {#each actions as action (action)}
          <div use:menu.item>
            <button
              on:click|stopPropagation={() => {
                handleAction(action);
                menu.close();
              }}
              use:menu.item
              class="bg-gray-100 block px-3 py-1 text-sm leading-6 text-gray-900"
              role="menuitem"
              tabindex="-1"
              id="options-menu-0-item-0">{action}</button
            >
          </div>
        {/each}
      </div>
    </Transition>
  </div></Card
>
