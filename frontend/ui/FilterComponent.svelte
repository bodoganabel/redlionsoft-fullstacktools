<script lang="ts">
  import { EFilterOperator, type TFilters } from "./filter.types";
  import type { TTemplate } from "./template.types";
  import FilterHeader from "./FilterHeader.svelte";
  import FilterRow from "./FilterRow.svelte";
  import FilterActions from "./FilterActions.svelte";
  import { createEventDispatcher } from "svelte";

  export let activeFilters: TFilters = [
    { field: "", operator: EFilterOperator.contains, value: "" },
  ];
  export let templates: TTemplate[];
  export let onSelect: (name: string) => Promise<void>;
  export let onRename: (oldName: string, newName: string) => Promise<void>;
  export let onDelete: (name: string) => Promise<void>;
  export let onSave: (name: string) => Promise<void>;
  export let onFavorite: (name: string) => Promise<void>;
  export let onReorder: (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => Promise<void>;

  const dispatch = createEventDispatcher();

  function addFilter() {
    activeFilters = [
      ...activeFilters,
      { field: "", operator: EFilterOperator.contains, value: "" },
    ];
  }

  function removeFilter(index: number) {
    if (activeFilters.length === 1) {
      activeFilters = [
        { field: "", operator: EFilterOperator.contains, value: "" },
      ];
    } else {
      activeFilters = activeFilters.filter((_, filterIndex) => filterIndex !== index);
    }
    dispatch("filterChange", { filters: activeFilters });
  }

  function updateFilter() {
    dispatch("filterChange", { filters: activeFilters });
  }

  function clearFilters() {
    activeFilters = [
      { field: "", operator: EFilterOperator.contains, value: "" },
    ];
    dispatch("filterChange", { filters: activeFilters });
  }

  $: showClearButton =
    activeFilters.length > 1 ||
    activeFilters.some((filter) => filter.field !== "" || filter.value !== "");
</script>

<div class="p-4 card shadow-md">
  <FilterHeader {templates} {onSelect} />
  
  <div class="flex flex-col gap-3">
    {#each activeFilters as filter, index}
      <FilterRow
        {filter}
        onUpdate={updateFilter}
        onRemove={() => removeFilter(index)}
      />
    {/each}
  </div>

  <FilterActions
    {templates}
    {onSelect}
    {onRename}
    {onDelete}
    {onSave}
    {onFavorite}
    {onReorder}
    onAddFilter={addFilter}
  />
</div>

<style>
</style>
