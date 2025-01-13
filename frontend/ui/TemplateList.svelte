<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import IconEdit from "../icons/IconEdit.svelte";
  import IconTrash from "../icons/IconTrash.svelte";

  type TTemplateItem = {
    id: string;
    name: string;
    isFavorite?: boolean;
  };

  export let items: TTemplateItem[] = [];

  export let selectedItemId: string | null = null;
  export let showSaveDialog = false;
  export let newItemName = "";

  export let onSelect: (item: TTemplateItem) => void;
  export let onRename: (item: TTemplateItem) => void;
  export let onDelete: (item: TTemplateItem) => void;
  export let onSave: (item: TTemplateItem) => void;
  export let onFavorite: (item: TTemplateItem) => void;
</script>

<div class="flex flex-col card max-w-max">
  <div class="template-list-row">
    <button>Save current as template</button>
  </div>

  <hr />
  {#each items as item}
    <div
      class="template-list-row px-2 flex justify-stretch items-center w-full group hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <button
        class="btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        style={item.isFavorite ? "visibility: visible" : ""}
        >{item.isFavorite ? "★" : "☆"}</button
      >
      <button class="w-full text-left"
        ><div class="w-full text-left">
          {item.name}
        </div>
      </button>
      <button
        class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        ><IconEdit /></button
      >
      <button
        class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        ><IconTrash /></button
      >
    </div>
  {/each}
</div>
