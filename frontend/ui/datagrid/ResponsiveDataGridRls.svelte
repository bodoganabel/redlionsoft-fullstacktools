<script lang="ts">
  import { onMount } from "svelte";
  import DataGridRls from "./DataGridRls.svelte";
  import DataGridMobile from "./DataGridMobile.svelte";
  import type { IColumnType } from "./data-grid.types";

  // Props (same as DataGridRls)
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

  // Responsive state
  let isMobile = false;
  let windowWidth = 0;

  // Update based on window size
  function updateResponsiveState() {
    // sm breakpoint is typically 640px in Tailwind/Skeleton
    isMobile = windowWidth < 640;
  }

  // Bind to resize event
  onMount(() => {
    if (typeof window === "undefined") return;

    // Set initial width
    windowWidth = window.innerWidth;
    updateResponsiveState();

    // Add resize listener
    const handleResize = () => {
      windowWidth = window.innerWidth;
      updateResponsiveState();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  // Handle scroll to bottom events from either component
  function handleBottomScrolled(event: CustomEvent) {
    // Forward the event
    dispatch("bottomScrolled", event.detail);
  }

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
</script>

<svelte:window bind:innerWidth={windowWidth} />

{#if isMobile}
  <DataGridMobile
    {data}
    {columns}
    {classOverride}
    {noHeader}
    {pagination}
    {itemsPerPage}
    {currentPage}
    {onSaveChanged}
    {onRowClick}
    on:bottomScrolled={handleBottomScrolled}
  />
{:else}
  <DataGridRls
    {data}
    {columns}
    {classOverride}
    {noHeader}
    {minCellWidth_px}
    {pagination}
    {itemsPerPage}
    {currentPage}
    {onSaveChanged}
    {onRowClick}
    on:bottomScrolled={handleBottomScrolled}
  />
{/if}
