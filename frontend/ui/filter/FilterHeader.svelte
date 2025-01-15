<script lang="ts">
  import type { TTemplate } from "./../template/template.types";

  export let templates: TTemplate[];
  export let onSelect: (name: string) => Promise<void>;
</script>

<div class="flex justify-start items-center mb-4 space-x-2">
  <h2 class="text-left">Filter</h2>
  {#each templates.filter((template) => template.isFavorite) as template}
    <button
      class="badge font-light variant-filled-surface text-xs"
      on:click={() => onSelect(template.name)}>{template.name}</button
    >
  {/each}
</div>
