<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import { clone } from "ramda";
  import type { IColumnType } from "./data-grid.types";
  import { EDataGridColumnTypes } from "./data-grid.types";
  import Footer from "./DatagridFooter.svelte";

  const dispatch = createEventDispatcher();

  export let data: any[] = [];
  export let columns: IColumnType<(typeof data)[0]>[] = [];
  export let classOverride: undefined | string = undefined;
  export let noHeader = false;
  export let pagination = false;
  export let itemsPerPage: number = 10;
  export let currentPage: number = 1;
  export let onSaveChanged: (changedData: any) => void = (changedData) => {};
  export let onRowClick: ((rowCurrentValue: any) => void) | undefined =
    undefined;

  /* Data editing */
  let originalData = clone(data);
  const changedRows = writable<any>([]);

  // Utility function to get a nested value (copied from DatagridRow)
  function getNestedValue(obj: any, path: string): any {
    return path
      .split(".")
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  function spreadProps(cell: any, row: any) {
    if (cell.componentPropsPopulator) {
      return { ...cell.componentPropsPopulator(row) };
    }
    return {};
  }

  function handleRowChanged(
    rowId: any,
    columnKey: string | number,
    newValue: any
  ) {
    changedRows.update((rows: any) => {
      const entireRowData = { ...data.find((item) => item._id === rowId) };
      entireRowData[columnKey] = newValue;

      const originalRow = originalData.find((item: any) => item._id === rowId);

      if (JSON.stringify(entireRowData) === JSON.stringify(originalRow)) {
        delete rows[rowId];
      } else {
        rows[rowId] = entireRowData;
      }

      return { ...rows };
    });
  }

  function saveChanges() {
    onSaveChanged($changedRows);
  }

  function resetChanges() {
    changedRows.set({});
    originalData = clone(originalData);
    data = [];
    setTimeout(() => {
      data = clone(originalData);
    }, 0);
  }

  /* Handle scroll to bottom */
  let containerRef: HTMLDivElement;

  const handleScroll = () => {
    if (containerRef) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef;
      const isBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

      if (isBottom) {
        dispatch("bottomScrolled", { text: "Hello!" });
      }
    }
  };

  onMount(() => {
    if (typeof window === "undefined") return;
    if (containerRef) {
      containerRef.addEventListener("scroll", handleScroll);
    }
  });

  onDestroy(() => {
    if (typeof window === "undefined") return;
    if (containerRef) {
      containerRef.removeEventListener("scroll", handleScroll);
    }
  });

  // Get displayed items based on pagination
  $: displayedData = pagination
    ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : data;
</script>

<div
  class={classOverride || "w-full flex flex-col overflow-hidden"}
  bind:this={containerRef}
>
  <!-- Mobile card-based layout -->
  <div class="overflow-y-auto grow px-2 py-2" bind:this={containerRef}>
    {#each displayedData as row, rowIdx}
      {#if row._id}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="card mb-4 p-3 {$changedRows[row._id] !== undefined
            ? 'border-l-4 border-warning-500'
            : ''} {onRowClick ? 'cursor-pointer' : ''}"
          on:click={() => {
            onRowClick !== undefined ? onRowClick(row) : undefined;
          }}
        >
          {#each columns as cell}
            <div
              class="flex justify-between py-2 border-b border-surface-300-600-token"
            >
              <!-- Column name/label -->
              <div class="font-medium text-sm flex-shrink-0 w-1/3 pr-2">
                {cell.title || cell.key}
              </div>

              <!-- Value display -->
              <div class="text-sm flex-grow">
                {#if cell.type === EDataGridColumnTypes.TEXT}
                  <p
                    style={cell.style
                      ? cell.style(getNestedValue(row, cell.key))
                      : ""}
                    class={cell.class
                      ? cell.class(getNestedValue(row, cell.key))
                      : ""}
                  >
                    {cell.transform
                      ? cell.transform(getNestedValue(row, cell.key))
                      : getNestedValue(row, cell.key)}
                  </p>
                {:else if cell.type === EDataGridColumnTypes.INPUT}
                  <input
                    value={getNestedValue(row, cell.key)}
                    class={cell.class
                      ? cell.class(getNestedValue(row, cell.key))
                      : "input w-full"}
                    on:input={(e) =>
                      handleRowChanged(
                        row._id,
                        cell.key,
                        e.currentTarget.value
                      )}
                  />
                {:else if cell.type === EDataGridColumnTypes.COMPONENT}
                  <svelte:component
                    this={cell.component}
                    {...spreadProps(cell, row)}
                  />
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-error-500">_id is missing from the row</p>
      {/if}
    {/each}
  </div>

  {#if $changedRows && Object.keys($changedRows).length}
    <div class="flex justify-center space-x-2 p-3 bg-warning-600 shadow-md">
      <button class="variant-outline-error" on:click={resetChanges}
        >Reset</button
      >
      <button class="variant-filled-primary" on:click={saveChanges}>Save</button
      >
    </div>
  {/if}

  <Footer {pagination} {data} bind:currentPage bind:itemsPerPage />
</div>
