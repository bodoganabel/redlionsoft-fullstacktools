<script lang="ts">
  import { UCrudResourceClient } from "../../../frontend/user-crud/user-crud.client";
  import {
    EFilterOperator,
    type TFilterField,
    type TFilterOperator,
    type TFilter,
    type TFilterTemplateResource,
    type TFilterTemplateData,
  } from "./filter.types";
  import FilterHeader from "./FilterHeader.svelte";
  import FilterRow from "./FilterRow.svelte";
  import FilterActions from "./FilterActions.svelte";

  export let baseUrl: string; //e.g.: "/app/submissions/api/submissions-filter-templates" - don't forget to create endpoints using ucrud-server.
  const filterTemplateUCrudClient =
    new UCrudResourceClient<TFilterTemplateData>(baseUrl);

  export let activeFilters: TFilter[] = [
    { field: "*", operator: EFilterOperator.contains, value: "" },
  ];
  export let templates: TFilterTemplateResource[];
  export let onRefetchData: () => void | Promise<void>;
  export let onSelect: (
    template: TFilterTemplateResource
  ) => Promise<void> = async (template: TFilterTemplateResource) => {
    activeFilters = template.data.filters;
    await onRefetchData();
  };
  export let onRename: (
    template: TFilterTemplateResource,
    newName: string
  ) => Promise<void> = async (template, newName) => {
    if (
      await filterTemplateUCrudClient.renameResource(
        template.resourceId,
        newName
      )
    ) {
      templates = await filterTemplateUCrudClient.loadResources();
    }
  };
  export let onDelete: (
    template: TFilterTemplateResource
  ) => Promise<void> = async (template) => {
    await filterTemplateUCrudClient.deleteResource(template, async () => {
      // If the deleted template was active, clear filters
      if (
        JSON.stringify(template.data.filters) === JSON.stringify(activeFilters)
      ) {
        clearFilters();
      }

      templates = await filterTemplateUCrudClient.loadResources();
      console.log("templates reloaded after delete:");
      console.log(templates);
    });
  };
  export let onSave: (name: string) => Promise<void> = async (name) => {
    if (
      await filterTemplateUCrudClient.saveResource(name, {
        filters: activeFilters,
        isFavorite: false,
      })
    ) {
      templates = await filterTemplateUCrudClient.loadResources();
    }
  };
  export let onFavorite: (
    template: TFilterTemplateResource
  ) => Promise<void> = async (template) => {
    await filterTemplateUCrudClient.favoriteResource({
      ...template,
      data: { ...template.data, isFavorite: !template.data.isFavorite },
    });
    templates = await filterTemplateUCrudClient.loadResources();
  };
  export let onReorder: (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => Promise<void> = async (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => {
    const { resourceId, newIndex } = event.detail;
    if (
      await filterTemplateUCrudClient.handleResourceReorder(
        resourceId,
        newIndex
      )
    ) {
      templates = await filterTemplateUCrudClient.loadResources();
    }
  };

  export let operators: TFilterOperator[] = [
    { value: EFilterOperator.contains, label: "contains" },
    { value: EFilterOperator.is, label: "is" },
    { value: EFilterOperator.is_not, label: "is not" },
    { value: EFilterOperator.greater_than, label: "is greater than" },
    { value: EFilterOperator.less_than, label: "is less than" },
  ];
  export let fields: TFilterField[];
  export let onFilterChange: (
    filters: TFilter[]
  ) => void | Promise<void> = async (filters: TFilter[]) => {
    activeFilters = filters;
    await onRefetchData();
  };

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
    onRefetchData();
  }

  $: showClearButton =
    activeFilters.length > 1 ||
    activeFilters.some((filter) => filter.field !== "*" || filter.value !== "");
</script>

<div class="p-4 card">
  <FilterHeader {templates} {onSelect} />

  <div class="flex flex-col gap-3">
    {#each activeFilters as filter, index}
      {#if index > 0}
        <hr />
      {/if}
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
    bind:templates
    {onSelect}
    {onRename}
    {onDelete}
    {onSave}
    {onFavorite}
    {onReorder}
    onAddFilter={addFilter}
  />
</div>
