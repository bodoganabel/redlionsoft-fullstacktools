<script lang="ts">
    import { toastError, toastNormal } from "../../functionality/toast/toast-logic";
    import { filterMagicWords } from "./filter-magic-words";

    export let onClose: () => void;


</script>

<div class="p-4 card">
    <h2 class="text-left">Filter magic words</h2>

    {#each filterMagicWords as word}
        <div class="flex items-center gap-2">
            <div class="">{word.label}</div>
            <button on:click={() => {
                
                navigator.clipboard.writeText(word.value).then(() => {
                    toastNormal(`Copied ${word.value}`);
                }).catch((error) => {
                    toastError('Failed to copy to clipboard:', error);
                });
                
                onClose()


            }} class="">{word.value}</button>
        </div>
    {/each}

</div>