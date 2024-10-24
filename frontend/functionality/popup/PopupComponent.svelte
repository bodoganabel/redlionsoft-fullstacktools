<script lang="ts">
    import { onMount, SvelteComponent } from "svelte";
    import { removePopup } from "./popup-logic";
    export let id: string;
    export let title: string;
    export let message: string;
    export let component: typeof SvelteComponent | undefined = undefined;
    export let componentProps: Record<string, any> = {};
    export let isOutsideClickClose: boolean = true;
    export let onClose: (() => void) | undefined;
    export let onAccept: (() => void) | undefined;
    export let acceptText: string = "Ok";
    export let closeText: string = "Cancel";

    console.log("componentProps:");
    console.log(componentProps);

    const closePopup = () => {
        onClose !== undefined ? onClose() : null;

        if (onClose !== undefined) {
            onClose();
        }
        removePopup(id);
    };

    const acceptPopup = () => {
        onAccept !== undefined ? onAccept() : null;
        removePopup(id);
    };

    const handleOutsideClick = (e: MouseEvent) => {
        if (
            isOutsideClickClose &&
            (e.target as HTMLElement).classList.contains("popup-overlay")
        ) {
            closePopup();
        }
    };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="popup-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    on:click={handleOutsideClick}
>
    <div class="popup bg-surface-500 p-6 rounded-md shadow-md max-w-lg w-full">
        <header class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">{title}</h2>
            <button class="text-xl font-bold" on:click={closePopup}>✕</button>
        </header>

        {#if message}
            <p class="mb-4">{message}</p>
        {/if}

        {#if component}
            <svelte:component this={component} {...componentProps} />
        {/if}

        {#if onClose !== undefined || onAccept !== undefined}
            <footer class="flex justify-end mt-4 space-x-2">
                {#if onClose !== undefined}
                    <button
                        class="btn variant-outline-secondary"
                        on:click={closePopup}>{closeText}</button
                    >
                {/if}
                {#if onAccept !== undefined}
                    <button
                        class="btn variant-filled-primary"
                        on:click={acceptPopup}>{acceptText}</button
                    >
                {/if}
            </footer>
        {/if}
    </div>
</div>

<style>
    .popup-overlay {
        background: rgba(0, 0, 0, 0.5);
    }
    .popup {
        max-width: 500px;
        border-radius: 8px;
        padding: 16px;
    }
</style>
