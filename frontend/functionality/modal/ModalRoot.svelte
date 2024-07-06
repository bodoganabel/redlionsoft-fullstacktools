<script lang="ts">
    import { get } from "svelte/store";
    import { getModalStore, modalClose } from "./modal.store";
    import CloseIcon from "../../icons/CloseIcon.svelte";
    import LockClosedIcon from "../../icons/LockClosedIcon.svelte";

    const handleKeyDown = (event: { key: string }) => {
        // Close modal on pressing escape key
        console.log("event.key:");
        console.log(event.key);
        if (event.key === "Escape") {
            modalClose();
        }
    };
</script>

<div
    class={`${
        get(getModalStore()).isVisible ? "" : "hidden"
    } modal-backdrop fixed top-0 left-0 right-0 bottom-0 overflow-y-auto bg-surface-backdrop-token z-[999]`}
    data-testid="modal-backdrop"
    style=""
>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="modal-transition w-full h-fit min-h-full p-4 overflow-y-auto flex justify-center items-center"
        style=""
        on:click={(event) => {
            if (
                get(getModalStore()).isOutclickClose &&
                event.target === event.currentTarget
            ) {
                modalClose();
            }
        }}
        on:keydown={handleKeyDown}
    >
        <div
            class="modal contents"
            data-testid="modal-component"
            role="dialog"
            aria-modal="true"
            aria-label="Custom Modal Component"
        >
            <div
                class="modal card p-4 pt-1 w-modal shadow-xl space-y-4 bg-slate-50"
            >
                <div
                    class="modal-container flex w-full justify-between items-center"
                >
                    <h2 class="modal-title text-lg">
                        {@html get(getModalStore()).title}
                    </h2>
                    <div class="flex items-center space-x-2">
                        {#if !get(getModalStore()).isOutclickClose}
                            <div class="opacity-20">
                                <LockClosedIcon />
                            </div>
                        {/if}
                        <button class="icon" on:click={() => modalClose()}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>
                {#if get(getModalStore()).content}
                    <div class="flex flex-col items-center">
                        <svelte:component
                            this={get(getModalStore()).content}
                            {...get(getModalStore()).params}
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
