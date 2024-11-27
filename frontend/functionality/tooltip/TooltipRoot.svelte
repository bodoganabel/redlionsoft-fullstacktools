<script lang="ts">
  import { tooltipStore } from "./tooltip.store";

  function closeTooltip() {
    tooltipStore.set({ content: "", visible: false, x: 0, y: 0 });
    console.log("I run");
    document.removeEventListener("click", closeTooltip);
  }

  let tooltipRef: HTMLElement;

  let content = "";
  let visible = false;
  $: {
    if (
      typeof window !== "undefined" &&
      typeof document !== "undefined" &&
      tooltipRef !== undefined
    ) {
      content = $tooltipStore.content;
      visible = $tooltipStore.visible;
      console.log("tooltopStore from root:");
      console.log($tooltipStore);
      if ($tooltipStore.visible) {
        document.addEventListener("click", closeTooltip);
        tooltipRef.style.left = `${$tooltipStore.x}px`;
        tooltipRef.style.top = `${$tooltipStore.y}px`;
      }
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

<div
  bind:this={tooltipRef}
  id="tooltip-root"
  class="card p-4 absolute z-20 variant-filled-primary transform -translate-x-1/2 -translate-y-full shadow-lg"
  class:visible={$tooltipStore.visible}
  class:hidden={!$tooltipStore.visible}
  on:click|stopPropagation={() => {}}
>
  <p>{content}</p>
  <div class="arrow variant-filled-primary"></div>
</div>

<style>
  /* You can extend styling here if needed */
</style>
