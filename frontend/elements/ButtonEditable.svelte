<script lang="ts">
    import IconEdit from "../icons/IconEdit.svelte";

    export let isSelected: boolean = true;
    export let onClick: ()=>any;
    export let onEdit: ()=>any;
</script>

<div class="relative">
      <button
        class="variant-outline-primary"
        class:variant-filled-primary={isSelected}
        on:click={()=>onClick()}><slot /></button
      >
      <button
        class="btn-icon variant-filled-secondary size-6 p-1 absolute -top-2 -right-2"
        on:click={()=>onEdit()}><IconEdit /></button
      >
    </div>