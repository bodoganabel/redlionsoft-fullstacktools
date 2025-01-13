<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import IconEdit from "../icons/IconEdit.svelte";
  import IconTrash from "../icons/IconTrash.svelte";
  import { popupInput } from "../functionality/popup/popup-logic";

  type TTemplateItem = {
    uniqueName: string;
    isFavorite?: boolean;
  };

  export let items: TTemplateItem[] = [];

  export let selectedItemId: string | null = null;
  export let showSaveDialog = false;
  export let newItemName = "";

  export let onSelect: (name: string) => Promise<void>;
  export let onRename: (oldName: string, newName: string) => Promise<void>;
  export let onDelete: (name: string) => Promise<void>;
  export let onSave: (name: string) => Promise<void>;
  export let onFavorite: (name: string) => Promise<void>;

  function handleSave() {
    popupInput(
      "Save Template",
      (newValue: string) => {
        onSave(newValue);
        return {};
      },
      "",
      {
        id: "save-template-input",
        message: "Enter template name",
        isSaveClose: true,
        saveButtonTitle: "Save",
      }
    );
  }

  function handleRename(name: string) {
    popupInput(
      "Rename Template",
      (newValue: string) => {
        onRename(name, newValue);
        return {};
      },
      name,
      {
        id: `rename-template-${name}`,
        message: "Enter new name",
        isSaveClose: true,
        saveButtonTitle: "Rename",
      }
    );
  }
</script>

<div class="flex flex-col card shadow-md max-w-max">
  <div class="template-list-row">
    <button on:click={handleSave}>Save current as template</button>
  </div>

  <hr />
  {#each items as item}
    <div
      class="template-list-row px-2 flex justify-stretch items-center w-full group hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <button
        on:click={() => onFavorite(item.uniqueName)}
        class="btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        style={item.isFavorite ? "visibility: visible" : ""}
        >{item.isFavorite ? "★" : "☆"}</button
      >
      <button
        on:click={() => onSelect(item.uniqueName)}
        class="w-full text-left"
        ><div class="w-full text-left">
          {item.uniqueName}
        </div>
      </button>
      <button
        on:click={() => handleRename(item.uniqueName)}
        class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        ><IconEdit /></button
      >
      <button
        on:click={() => onDelete(item.uniqueName)}
        class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        ><IconTrash /></button
      >
    </div>
  {/each}
</div>
