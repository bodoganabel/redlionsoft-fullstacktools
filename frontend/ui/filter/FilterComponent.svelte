<script lang="ts">
  import { UCrudResourceClient } from '../../../frontend/user-crud/user-crud.client';
  import {
    EFilterOperator,
    type TFilterField,
    type TFilterOperator,
    type TSubmissionFilter,
    type TFilterTemplateResource,
    type TFilterTemplateData,
  } from './filter.types';
  import FilterHeader from './FilterHeader.svelte';
  import FilterRow from './FilterRow.svelte';
  import FilterActions from './FilterActions.svelte';
  import { popup } from '../../functionality/popup/popup-logic';

  export let baseUrl: string; //e.g.: "/app/submissions/api/submissions-filter-templates" - don't forget to create endpoints using ucrud-server.
  const filterTemplateUCrudClient = new UCrudResourceClient<TFilterTemplateData>(baseUrl);
  export let orderBy: string = '';
  export let orderDirection: 'asc' | 'desc' = 'desc';

  export let activeFilters: TSubmissionFilter[] = [
    { field: '*', operator: EFilterOperator.contains, value: '' },
  ];
  export let templates: TFilterTemplateResource[];
  export let onRefetchData: () => void | Promise<void>;
  export let onSelect: (template: TFilterTemplateResource) => Promise<void> = async (
    template: TFilterTemplateResource
  ) => {
    activeFilters = template.data.filters;
    await onRefetchData();
  };
  export let onRename: (
    template: TFilterTemplateResource,
    newName: string
  ) => Promise<void> = async (template, newName) => {
    if (await filterTemplateUCrudClient.renameResource(template.resourceId, newName)) {
      templates = await filterTemplateUCrudClient.loadResources();
    }
  };
  export let onDelete: (template: TFilterTemplateResource) => Promise<void> = async (template) => {
    popup({
      title: `Are you sure to delete template ${template.resourceId}?`,
      onAccept: async () => {
        await filterTemplateUCrudClient.deleteResource(template);
        if (JSON.stringify(template.data.filters) === JSON.stringify(activeFilters)) {
          clearFilters();
        }
        templates = await filterTemplateUCrudClient.loadResources();
      },
      onClose: () => {
        // Do nothing
      },
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
  export let onFavorite: (template: TFilterTemplateResource) => Promise<void> = async (
    template
  ) => {
    await filterTemplateUCrudClient.favoriteResource({
      ...template,
      data: { ...template.data, isFavorite: !template.data.isFavorite },
    });
    templates = await filterTemplateUCrudClient.loadResources();
  };
  export let onReorder: (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => Promise<void> = async (event: CustomEvent<{ resourceId: string; newIndex: number }>) => {
    const { resourceId, newIndex } = event.detail;
    if (await filterTemplateUCrudClient.handleResourceReorder(resourceId, newIndex)) {
      templates = await filterTemplateUCrudClient.loadResources();
    }
  };

  export let operators: TFilterOperator[] = [
    { value: EFilterOperator.contains, label: 'contains' },
    { value: EFilterOperator.is, label: 'is' },
    { value: EFilterOperator.is_not, label: 'is not' },
    { value: EFilterOperator.greater_than, label: 'is greater than' },
    { value: EFilterOperator.less_than, label: 'is less than' },
  ];
  export let fields: TFilterField[];
  export let onFilterChange: (filters: TSubmissionFilter[]) => void | Promise<void> = async (
    filters: TSubmissionFilter[]
  ) => {
    activeFilters = filters;
    await onRefetchData();
  };
  
  // Function to handle changes in ordering
  function handleOrderingChange() {
    onFilterChange(activeFilters);
  }

  function addFilter() {
    activeFilters = [
      ...activeFilters,
      { field: '*', operator: EFilterOperator.contains, value: '' },
    ];
  }

  function removeFilter(index: number) {
    if (activeFilters.length === 1) {
      activeFilters = [{ field: '*', operator: EFilterOperator.contains, value: '' }];
    } else {
      activeFilters = activeFilters.filter((_, filterIndex) => filterIndex !== index);
    }
    onFilterChange(activeFilters);
  }

  function updateFilter() {
    onFilterChange(activeFilters);
  }

  function clearFilters() {
    activeFilters = [{ field: '*', operator: EFilterOperator.contains, value: '' }];
    onRefetchData();
  }

  $: showClearButton =
    activeFilters.length > 1 ||
    activeFilters.some((filter) => filter.field !== '*' || filter.value !== '');
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
  <div class="mt-2 order-by flex flex-wrap gap-2 items-center">
    <div class="font-bold">Order by:</div>
    <div class="flex-1 flex gap-2 items-center">
      <select 
        class="select w-full md:w-auto" 
        bind:value={orderBy}
        on:change={handleOrderingChange}
      >
        <option value="">None</option>
        {#each fields as field}
          <option value={field.value}>{field.label}</option>
        {/each}
      </select>

      <select
        class="select w-auto"
        bind:value={orderDirection}
        on:change={handleOrderingChange}
        disabled={!orderBy}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>
    </div>

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
