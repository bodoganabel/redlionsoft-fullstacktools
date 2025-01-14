<!-- TooltipContainer can be used as a standalone component, wrapping a trigger element and a tooltip component. Tooltip component will be positioned relative to the trigger element -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let triggerRef: HTMLElement;
  export let visible = false;
  export let position: "top" | "bottom" = "top";
  export let onOutClick: () => void = () => {
    visible = false;
  };

  let containerRef: HTMLElement;

  function handleOutsideClick(event: MouseEvent) {
    if (!containerRef || !triggerRef) return;

    // Check if click is outside both the container and trigger element
    const isOutsideContainer = !containerRef.contains(event.target as Node);
    const isOutsideTrigger = !triggerRef.contains(event.target as Node);

    if (isOutsideContainer && isOutsideTrigger) {
      onOutClick();
    }
  }

  function updatePosition() {
    if (!containerRef || !triggerRef) return;

    const triggerRect = triggerRef.getBoundingClientRect();
    const containerRect = containerRef.getBoundingClientRect();

    // Center horizontally relative to trigger
    let left = triggerRect.left + (triggerRect.width - containerRect.width) / 2;

    // Ensure horizontal position stays within viewport
    const minLeft = 10;
    const maxLeft = window.innerWidth - containerRect.width - 10;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Position vertically based on position prop
    let top: number;
    if (position === "top") {
      top = triggerRect.top - containerRect.height - 8;
      // If would go off-screen top, flip to bottom
      if (top < 10) {
        top = triggerRect.bottom + 8;
      }
    } else {
      top = triggerRect.bottom + 8;
      // If would go off-screen bottom, flip to top
      if (top + containerRect.height > window.innerHeight - 10) {
        top = triggerRect.top - containerRect.height - 8;
      }
    }

    containerRef.style.left = `${left}px`;
    containerRef.style.top = `${top}px`;
  }

  onMount(() => {
    document.addEventListener("click", handleOutsideClick);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleOutsideClick);
    window.removeEventListener("scroll", updatePosition, true);
    window.removeEventListener("resize", updatePosition);
  });

  $: if (visible && containerRef && triggerRef) {
    // Use setTimeout to ensure the DOM has updated
    setTimeout(updatePosition, 0);
  }
</script>

<div bind:this={triggerRef}>
  <slot name="trigger" />
</div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  bind:this={containerRef}
  class="tooltip-container"
  class:visible
  on:click|stopPropagation
>
  <slot name="tooltip" />
</div>

<style>
  .tooltip-container {
    position: fixed;
    z-index: 50;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease-out;
  }

  .tooltip-container.visible {
    opacity: 1;
    pointer-events: auto;
  }
</style>
