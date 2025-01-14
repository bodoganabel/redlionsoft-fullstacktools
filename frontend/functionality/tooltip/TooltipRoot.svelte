<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import { tooltipStore } from "./tooltip.store";
  import type { Unsubscriber } from "svelte/store";

  function closeTooltip() {
    tooltipStore.set({
      content: "",
      visible: false,
      x: 0,
      y: 0,
      component: null,
      componentProps: null,
      position: "top",
    });
    console.log("I run");
    document.removeEventListener("click", closeTooltip);
  }

  let tooltipRef: HTMLElement;

  let content = "";
  let visible = false;

  let unsubscribe: Unsubscriber = () => {};
  onMount(async () => {
    unsubscribe = tooltipStore.subscribe(async () => {
      if (
        typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        tooltipRef !== undefined
      ) {
        await calculateTooltipPosition();
      }
    });
  });

  onDestroy(() => {
    unsubscribe();
  });

  async function calculateTooltipPosition() {
    if ($tooltipStore.visible) {
      document.addEventListener("click", closeTooltip);

      // Calculate tooltip position
      let tooltipX = $tooltipStore.x;
      let tooltipY = $tooltipStore.y;

      // Adjust position to keep the tooltip within the viewport
      tooltipRef.style.left = `${tooltipX}px`;
      tooltipRef.style.top = `${tooltipY}px`;

      // Wait for the DOM to update
      await tick();

      // Calculate tooltip position if it goes out of viewport
      const tooltipRect = tooltipRef.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let isModified = false;
      if (tooltipRect.right > viewportWidth) {
        tooltipX -= tooltipRect.right - viewportWidth;
        isModified = true;
      }
      if (tooltipRect.bottom > viewportHeight) {
        tooltipY -= tooltipRect.bottom - viewportHeight;
        isModified = true;
      }
      if (tooltipRect.left < 0) {
        tooltipX += Math.abs(tooltipRect.left);
        isModified = true;
      }
      if (tooltipRect.top < 0) {
        tooltipY += Math.abs(tooltipRect.top);
        isModified = true;
      }

      if (isModified) {
        tooltipRef.style.left = `${tooltipX}px`;
        tooltipRef.style.top = `${tooltipY}px`;
      }
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

<div
  bind:this={tooltipRef}
  id="tooltip-root"
  class={$tooltipStore.component !== null
    ? "absolute z-10 transform -translate-x-1/2" +
      ($tooltipStore.position === "top" ? " -translate-y-full" : "")
    : "card p-4 absolute z-10 variant-filled-primary shadow-lg transform -translate-x-1/2" +
      ($tooltipStore.position === "top" ? " -translate-y-full" : "")}
  class:visible={$tooltipStore.visible}
  class:hidden={!$tooltipStore.visible}
  on:click|stopPropagation={() => {}}
>
  {#if $tooltipStore.content}
    <p>{@html $tooltipStore.content}</p>
  {:else if $tooltipStore.component}
    <svelte:component
      this={$tooltipStore.component}
      {...$tooltipStore.componentProps || {}}
    />
  {/if}
  <div
    class="arrow variant-filled-primary"
    class:arrow-top={$tooltipStore.position === "bottom"}
    class:arrow-bottom={$tooltipStore.position === "top"}
  ></div>
</div>

<style>
  .arrow {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
  }

  .arrow-bottom {
    bottom: -8px;
    border-top: 8px solid var(--color-primary-500);
    border-bottom: none;
  }

  .arrow-top {
    top: -8px;
    border-bottom: 8px solid var(--color-primary-500);
    border-top: none;
  }

  /* Only apply arrow styling when no component is present */
  :global(#tooltip-root:not(:has(svelte\:component)) .arrow) {
    display: block;
  }

  :global(#tooltip-root:has(svelte\:component)) .arrow {
    display: none;
  }
</style>
