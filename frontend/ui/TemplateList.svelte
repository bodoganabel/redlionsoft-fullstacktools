<script lang="ts">
  import IconEdit from "../icons/IconEdit.svelte";
  import IconTrash from "../icons/IconTrash.svelte";
  import { popup, popupInput } from "../functionality/popup/popup-logic";
  import type { TTemplate } from "./template.types";
  import { createEventDispatcher } from "svelte";
  import IconDragHandle from "../icons/IconDragHandle.svelte";

  export let templates: TTemplate[] = [];
  export let onSelect: (name: string) => Promise<void>;
  export let onRename: (oldName: string, newName: string) => Promise<void>;
  export let onDelete: (name: string) => Promise<void>;
  export let onSave: (name: string) => Promise<void>;
  export let onFavorite: (name: string) => Promise<void>;
  export let onReorder: (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => Promise<void>;

  let draggedItem: string | null = null;
  let draggedOverItem: string | null = null;

  function handleDragStart(e: DragEvent, name: string) {
    if (!e.dataTransfer) return;
    draggedItem = name;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", name);
  }

  function handleDragOver(e: DragEvent, name: string) {
    e.preventDefault();
    if (draggedItem === name) return;
    draggedOverItem = name;
  }

  function handleDragLeave() {
    draggedOverItem = null;
  }

  function handleDrop(e: DragEvent, name: string) {
    e.preventDefault();
    if (!draggedItem || draggedItem === name) return;

    const fromIndex = templates.findIndex((t) => t.name === draggedItem);
    const toIndex = templates.findIndex((t) => t.name === name);

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorder(
        new CustomEvent("reorder", {
          detail: {
            resourceId: draggedItem,
            newIndex: toIndex,
          },
        })
      );
    }

    draggedItem = null;
    draggedOverItem = null;
  }

  async function handleSave() {
    popupInput(
      "Save Template",
      async (newValue: string) => {
        const existingTemplate = templates.find(
          (item) => item.name === newValue
        );
        if (existingTemplate) {
          popup({
            id: "confirm-overwrite",
            title: "Template already exists",
            message:
              "A template with this name already exists. Do you want to overwrite it?",
            onAccept: async () => {
              await onSave(newValue);
            },
            acceptMessage: "Overwrite",
            closeMessage: "Cancel",
          });
        } else {
          await onSave(newValue);
        }
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

  async function handleRename(name: string) {
    popupInput(
      "Rename Template",
      async (newValue: string) => {
        if (newValue === name) {
          return {};
        }

        const existingTemplate = templates.find(
          (item) => item.name === newValue
        );
        if (existingTemplate) {
          popup({
            id: "confirm-rename-override",
            title: "Template already exists",
            message:
              "A template with this name already exists. Do you want to override it?",
            onAccept: async () => {
              await onRename(name, newValue);
            },
            acceptMessage: "Override",
            closeMessage: "Cancel",
          });
        } else {
          await onRename(name, newValue);
        }
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
  {#each templates as item}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="template-list-row px-2 flex justify-stretch items-center w-full group hover:bg-gray-100 dark:hover:bg-gray-700 cursor-move"
      draggable="true"
      on:dragstart={(e) => handleDragStart(e, item.name)}
      on:dragover={(e) => handleDragOver(e, item.name)}
      on:dragleave={handleDragLeave}
      on:drop={(e) => handleDrop(e, item.name)}
      class:dragging={draggedItem === item.name}
      class:drag-over={draggedOverItem === item.name}
    >
      <button
        on:click={() => onFavorite(item.name)}
        class="btn-icon w-5 h-5 {item.isFavorite
          ? ''
          : 'invisible group-hover:visible'} transition-none"
        >{item.isFavorite ? "★" : "☆"}</button
      >
      <button on:click={() => onSelect(item.name)} class="w-full text-left"
        ><div class="w-full text-left">
          {item.name}
        </div>
      </button>
      <div
        class="drag-handle btn-icon w-5 h-5 invisible group-hover:visible transition-none"
      >
        <!-- svelte-ignore missing-declaration -->
        <IconDragHandle />
      </div>
      <button
        on:click={() => handleRename(item.name)}
        class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        ><IconEdit /></button
      >
      <button
        on:click={() => onDelete(item.name)}
        class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
        ><IconTrash /></button
      >
    </div>
  {/each}
</div>

<style>
  .dragging {
    opacity: 0.5;
  }
  .drag-over {
    border-bottom: 2px solid #4f46e5;
  }
  .drag-handle {
    cursor: grab;
  }
  .drag-handle:active {
    cursor: grabbing;
  }
</style>
