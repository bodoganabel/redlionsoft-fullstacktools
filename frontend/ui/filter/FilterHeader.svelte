<script lang="ts">
  import { onMount } from "svelte";
  import type { TFilterTemplateResource } from "./filter.types";

  export let templates: TFilterTemplateResource[];
  export let onSelect: (template: TFilterTemplateResource) => Promise<void>;

  $: favoriteTemplates = templates.filter(
    (template) => template.data.isFavorite
  );
  $: {
    favoriteTemplates = favoriteTemplates;
    console.log("favoriteTemplates:");
    console.log(favoriteTemplates);
  }

  onMount(() => {});
</script>

<div class="flex justify-start items-center mb-4 space-x-2">
  <h2 class="text-left">Filter</h2>
  {#each favoriteTemplates as template}
    <button
      class="badge font-light variant-filled-surface text-xs"
      on:click={() => onSelect(template)}>{template.resourceId}</button
    >
  {/each}
</div>
