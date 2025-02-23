<script lang="ts">
  import type { TFilterTemplateResource } from "./filter.types";

  export let templates: TFilterTemplateResource[];
  export let onSelect: (template: TFilterTemplateResource) => Promise<void>;
</script>

<div class="flex justify-start items-center mb-4 space-x-2">
  <h2 class="text-left">Filter</h2>
  {#each templates.filter((template) => template.data.isFavorite) as template}
    <button
      class="badge font-light variant-filled-surface text-xs"
      on:click={() => onSelect(template)}>{template.resourceId}</button
    >
  {/each}
</div>
