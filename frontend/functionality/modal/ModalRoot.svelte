<script lang="ts">
    import { get } from "svelte/store";
    import { modalClose, modalStore } from "./modal.store";
    import CloseIcon from "../../icons/CloseIcon.svelte";
    import LockClosedIcon from "../../icons/LockClosedIcon.svelte";
    import { onMount } from "svelte";

    const handleKeyDown = (event: { key: string }) => {
        // Close modal on pressing escape key
        console.log("event.key:");
        console.log(event.key);
        if (event.key === "Escape") {
            modalClose();
        }
    };

    $: {
        console.log("getModalStore() from ModalRoot:");
        console.log($modalStore);
    }

    onMount(() => {
        console.log("ModalRootMounted");
    });
</script>

<div
    class={`${
        $modalStore.isVisible ? "" : "hidden"
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
                $modalStore.isOutclickClose &&
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
                    class="modal-container mt-2 flex w-full justify-between items-center"
                >
                    <header class="modal-header text-2xl font-bold">
                        {@html $modalStore.title}
                    </header>
                    <div class="flex items-center w-6">
                        {#if !$modalStore.isOutclickClose}
                            <div class="opacity-20">
                                <LockClosedIcon />
                            </div>
                        {/if}
                        <button class="icon" on:click={() => modalClose()}>
                            <CloseIcon />
                        </button>
                    </div>
                </div>
                {#if $modalStore.content}
                    <div class="flex flex-col items-center">
                        <svelte:component
                            this={$modalStore.content}
                            {...$modalStore.params}
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
