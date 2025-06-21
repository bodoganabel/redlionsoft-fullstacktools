<script lang="ts">
  import IconRectangles from './../../icons/IconRectangles.svelte';
  import TooltipContainer from '../../functionality/tooltip/TooltipContainer.svelte';
  import TemplateList from './../template/TemplateList.svelte';
  import {
    EFilterOperator,
    type TSubmissionFilter,
    type TFilterTemplateResource,
  } from './filter.types';

  export let templates: TFilterTemplateResource[];
  export let activeFilters: TSubmissionFilter[];
  export let onSelect: (template: TFilterTemplateResource) => Promise<void>;
  export let onRename: (template: TFilterTemplateResource, newName: string) => Promise<void>;
  export let onDelete: (template: TFilterTemplateResource) => Promise<void>;
  export let onSave: (name: string) => Promise<void>;
  export let onFavorite: (template: TFilterTemplateResource) => Promise<void>;
  export let onReorder: (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => Promise<void>;
  export let onAddFilter: () => void;

  let tooltipVisible = false;
</script>

<div class="mt-4 flex justify-start items-center space-x-2">
  <button
    on:click={onAddFilter}
    class="text-sm text-white variant-filled-secondary rounded-lg flex items-center gap-2"
  >
    + Add Filter
  </button>

  <TooltipContainer position="bottom" bind:visible={tooltipVisible}>
    <button
      slot="trigger"
      class="btn-icon p-1 w-10 h-10 text-sm variant-filled-secondary rounded-lg flex items-center gap-2"
      on:click={() => (tooltipVisible = true)}
    >
      <IconRectangles />
    </button>

    <div slot="tooltip">
      <TemplateList
        bind:templates
        {onSelect}
        {onRename}
        {onDelete}
        {onSave}
        {onFavorite}
        {onReorder}
      />
    </div>
  </TooltipContainer>

  {#if activeFilters.some((filter) => filter.value !== '') || activeFilters.length > 1}
    <button
      class="text-sm variant-soft-secondary rounded-lg"
      on:click={() => {
        activeFilters = [{ field: '', operator: EFilterOperator.contains, value: '' }];
      }}
    >
      Clear Filters
    </button>
  {/if}
</div>
