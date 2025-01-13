<script lang="ts">
  import Row from "./DatagridRow.svelte";
  import { onDestroy, onMount } from "svelte";
  import type { IColumnType } from "./data-grid.types";
  import { createEventDispatcher } from "svelte";
  import Header from "./DatagridHeader.svelte";
  import Footer from "./DatagridFooter.svelte";
  import { writable } from "svelte/store";
  import { clone } from "ramda";

  const dispatch = createEventDispatcher();

  export let data: any[] = [];
  export let columns: IColumnType<(typeof data)[0]>[] = [];
  export let classOverride: undefined | string = undefined;
  export let noHeader = false;
  export let minCellWidth_px = 16;
  export let pagination = false;
  export let itemsPerPage: number = 10;
  export let currentPage: number = 1;
  export let onSaveChanged: (changedData: any) => void = (changedData) => {};
  export let onRowClick: ((rowCurrentValue: any) => void) | undefined =
    undefined;

  /* Cell width calculation */

  let container: HTMLDivElement;
  let cellWidthInPixels: number;

  const calculateCellWidth = () => {
    if (container) {
      const containerWidth = container.clientWidth;

      const minWidthsTotal = columns.reduce(
        (acc, col) => acc + (col.minWidth || 0),
        0
      );
      const maxWidthsTotal = columns.reduce((acc, col) => {
        if (col.maxWidth) {
          return acc + col.maxWidth;
        }
        return acc + (col.minWidth || 0);
      }, 0);

      // Space taken by columns with explicit minWidth or maxWidth
      const fixedWidthsTotal = minWidthsTotal + maxWidthsTotal;

      let remainingWidth = containerWidth - fixedWidthsTotal;
      if (remainingWidth < 0) {
        cellWidthInPixels = 0;
        return;
      }

      let unspecifiedColumnsCount = columns.filter(
        (col) => !col.minWidth && !col.maxWidth
      ).length;
      cellWidthInPixels =
        unspecifiedColumnsCount > 0
          ? remainingWidth / unspecifiedColumnsCount
          : 0;

      if (cellWidthInPixels < minCellWidth_px) {
        cellWidthInPixels = minCellWidth_px;
      }
    }
  };

  /* Scroll to bottom event*/

  let bodyContainer: HTMLDivElement;

  const handleScroll = () => {
    const scrollHeight = bodyContainer.scrollHeight;
    const scrollTop = bodyContainer.scrollTop;
    const clientHeight = bodyContainer.clientHeight;

    const isBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

    if (isBottom) {
      dispatch("bottomScrolled", {
        text: "Hello!",
      });
    }
  };

  /* Data editing */

  let originalData = clone(data);

  const changedRows = writable<any>([]);
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
    changedRows.set({}); // Clear all changes
    originalData = clone(originalData); // Ensure the original data is fresh
    data = []; // Temporarily clear data to trigger a reactivity update
    setTimeout(() => {
      data = clone(originalData); // Reset `data` to its original state
    }, 0); // Use a timeout to ensure the DOM re-renders
  }

  onMount(() => {
    if (typeof window === "undefined") return;

    /* Calculating cellWidth */
    window.addEventListener("resize", calculateCellWidth);
    calculateCellWidth(); // initial calculation

    /* scroll to bottom event listener */
    bodyContainer.addEventListener("scroll", handleScroll);
  });
  onDestroy(() => {
    if (typeof window === "undefined") return;

    /* Calculating cellWidth */
    window.removeEventListener("resize", calculateCellWidth);

    /* scroll to bottom event listener */
    bodyContainer.removeEventListener("scroll", handleScroll);
  });

  /* Optional pagination */
</script>

<div
  class={classOverride ||
    "datagrid w-full flex flex-col overflow-hidden shadow-md dark:border-gray-600 dark:border"}
  bind:this={container}
>
  <Header {columns} {noHeader} {cellWidthInPixels} />

  <div class="datagrid-body overflow-y-auto grow" bind:this={bodyContainer}>
    {#each pagination ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : data as row, rowIdx}
      {#if row._id}
        <Row
          cells={columns}
          {cellWidthInPixels}
          {row}
          onClickRow={() => {
            onRowClick !== undefined ? onRowClick(row) : undefined;
          }}
          handleRowChange={(keyPath, value) => {
            handleRowChanged(row._id, keyPath, value);
          }}
          isChanged={$changedRows[row._id] !== undefined}
        />
      {:else}
        <p class="text-error-500">_id is missing from the row</p>
      {/if}
    {/each}
  </div>

  {#if $changedRows && Object.keys($changedRows).length}
    <div class="flex justify-center space-x-2 p-3 bg-warning-600 shadow-md">
      <button class="variant-outline-error" on:click={resetChanges}
        >Reset All Changes</button
      >
      <button class="variant-filled-primary" on:click={saveChanges}
        >Save Changes</button
      >
    </div>
  {/if}
  <Footer {pagination} {data} bind:currentPage bind:itemsPerPage />
</div>
