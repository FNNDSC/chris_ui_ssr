<script lang="ts">
    import { Check } from "lucide-svelte";
    import DisplayDetails from "./DisplayDetails.svelte";
    import ButtonIcon from "./ButtonIcon.svelte";
  
    export let fileName: string;
    export let currentStep: string;
    export let done: boolean;
    export let iconType: string;
    export let handleCancel: () => void;
  </script>
  
  <DisplayDetails>
    <ButtonIcon slot="icon" text="Close" {iconType} />
    <p slot="key" class="w-0 flex-1 text-sm font-medium truncate text-white">
      {fileName}
    </p>
  
    <svelte:fragment slot="progress">
      <p class="text-sm font-medium mr-4 text-gray-400">
        <i>
          {currentStep}...
        </i>
      </p>
      {#if done}
        <Check class="h-5 w-5 text-green-400" />
      {:else}
        <slot name="progress" />
      {/if}
    </svelte:fragment>
  
    <ButtonIcon on:close={handleCancel} slot="close" text="" iconType="close" />
  </DisplayDetails>
  