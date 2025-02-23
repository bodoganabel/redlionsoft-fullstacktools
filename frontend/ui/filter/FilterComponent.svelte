<script lang="ts">
  import {
    EFilterOperator,
    type TFilterField,
    type TFilterOperator,
    type TFilter,
    type TFilterTemplateResource,
  } from "./filter.types";
  import FilterHeader from "./FilterHeader.svelte";
  import FilterRow from "./FilterRow.svelte";
  import FilterActions from "./FilterActions.svelte";

  export let activeFilters: TFilter[] = [
    { field: "*", operator: EFilterOperator.contains, value: "" },
  ];
  export let templates: TFilterTemplateResource[];
  export let onSelect: (template: TFilterTemplateResource) => Promise<void>;
  export let onRename: (
    template: TFilterTemplateResource,
    newName: string
  ) => Promise<void>;
  export let onDelete: (name: string) => Promise<void>;
  export let onSave: (name: string) => Promise<void>;
  export let onFavorite: (template: TFilterTemplateResource) => Promise<void>;
  export let onReorder: (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => Promise<void>;
  export let operators: TFilterOperator[] = [
    { value: EFilterOperator.contains, label: "contains" },
    { value: EFilterOperator.is, label: "is" },
    { value: EFilterOperator.is_not, label: "is not" },
    { value: EFilterOperator.greater_than, label: "is greater than" },
    { value: EFilterOperator.less_than, label: "is less than" },
  ];
  export let fields: TFilterField[];
  export let onFilterChange: (filters: TFilter[]) => void;

  function addFilter() {
    activeFilters = [
      ...activeFilters,
      { field: "*", operator: EFilterOperator.contains, value: "" },
    ];
  }

  function removeFilter(index: number) {
    if (activeFilters.length === 1) {
      activeFilters = [
        { field: "*", operator: EFilterOperator.contains, value: "" },
      ];
    } else {
      activeFilters = activeFilters.filter(
        (_, filterIndex) => filterIndex !== index
      );
    }
    onFilterChange(activeFilters);
  }

  function updateFilter() {
    onFilterChange(activeFilters);
  }

  function clearFilters() {
    activeFilters = [
      { field: "*", operator: EFilterOperator.contains, value: "" },
    ];
    onFilterChange(activeFilters);
  }

  $: showClearButton =
    activeFilters.length > 1 ||
    activeFilters.some((filter) => filter.field !== "*" || filter.value !== "");
</script>

<div class="p-4 card">
  <FilterHeader {templates} {onSelect} />

  <div class="flex flex-col gap-3">
    {#each activeFilters as filter, index}
      <FilterRow
        {filter}
        {operators}
        {fields}
        onUpdate={updateFilter}
        onRemove={() => removeFilter(index)}
      />
    {/each}
  </div>

  <FilterActions
    bind:activeFilters
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
