<script lang="ts">
  import { onMount } from "svelte";

  export let background = "#333";
  export let hoverColor = "#0f0";
  export let width = "100%";
  export let height = "100%";
  export let classesContainer = "";
  export let classesCard = "";
  export let glowWidth = "50rem";
  export let glowHeight = "50rem";

  let card: HTMLElement;

  function handleMouseMove(event: MouseEvent) {
    const x = event.pageX - card.offsetLeft;
    const y = event.pageY - card.offsetTop;
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  }
</script>

<div
  class={"container " + classesContainer}
  style={"width: " + width + "; height: " + height}
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class={"card " + classesCard}
    style="--clr: {hoverColor}; --background: {background}; --glowWidth: {glowWidth}; --glowHeight: {glowHeight};"
    bind:this={card}
    on:mousemove={handleMouseMove}
  >
    <div class="glow-card-content">
      <slot />
    </div>
  </div>
</div>

<style>
  .card {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--background);
    border-radius: 10px;
    z-index: 1; /* Ensure the card itself is on top of the container */
  }

  .card::before {
    content: "";
    position: absolute;
    top: var(--y);
    left: var(--x);
    transform: translate(-50%, -50%);
    background: radial-gradient(var(--clr), transparent, transparent);
    width: var(--glowWidth);
    height: var(--glowHeight);
    opacity: 0;
    transition:
      0.5s,
      top 0s,
      left 0s;
    pointer-events: none; /* Ensure the glow does not block interactions */
    z-index: 0; /* Ensure it's below the card content */
  }

  .card:hover::before {
    opacity: 1;
  }

  .card::after {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: 14px;
    background: rgba(var(--background), 0.75);
    z-index: 0; /* Ensure it's below the card content and glow */
  }

  .card > * {
    position: relative;
    z-index: 1; /* Ensure child elements are on top of the glow */
  }
</style>
