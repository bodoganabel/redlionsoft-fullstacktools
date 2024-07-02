<script lang="ts">

export let background = "#333"
export let hoverColor = "#0f0";
export let width = "100%";
export let height = "100%";
export let classesContainer = "";
export let classesCard = "";
export let  glowWidth = "50rem";
export let  glowHeight = "50rem";

    let card: HTMLElement;

    function handleMouseMove(event: MouseEvent) {
        const x = event.pageX - card.offsetLeft;
        const y = event.pageY - card.offsetTop;
        card.style.setProperty("--x", `${x}px`);
        card.style.setProperty("--y", `${y}px`);
    }
</script>

<div class={"container"+classesContainer} style={"width: " + width + "; height: " + height}>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class={"card "+classesCard}
        style="--clr: {hoverColor}; --background: {background};"
        bind:this={card}
        on:mousemove={handleMouseMove}
    ><slot/></div>
</div>

<style>

    .card {
        position: relative;
        width: 100%;
        height: 100%;
        margin: 10px;
        overflow: hidden;
        background: (var(--background));
        border-radius: 10px;
    }

    .card::before {
        content: "";
        position: absolute;
        top: var(--y);
        left: var(--x);
        transform: translate(-50%, -50%);
        background: radial-gradient(var(--clr), transparent, transparent);
        width: 700px;
        height: 700px;
        opacity: 0;
        transition:
            0.5s,
            top 0s,
            left 0s;
    }

    .card:hover::before {
        opacity: 1;
    }

    .card::after {
        content: "";
        position: absolute;
        inset: 2px;
        border-radius: 18px;
        background: rgba(45, 45, 45, 0.75);
    }
</style>
