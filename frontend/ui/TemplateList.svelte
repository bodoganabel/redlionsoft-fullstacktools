<script lang="ts">
  import { popup, popupInput } from "../functionality/popup/popup-logic";
  import type { TTemplate } from "./template.types";
  import SaveTemplateButton from "./SaveTemplateButton.svelte";
  import TemplateListItem from "./TemplateListItem.svelte";

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
  let isDraggingUp = false;

  function handleDragStart(templateName: string) {
    return (event: DragEvent) => {
      if (!event.dataTransfer) return;
      draggedItem = templateName;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", templateName);
      draggedOverItem = null;
      isDraggingUp = false;
    };
  }

  function handleDragOver(templateName: string) {
    return (event: DragEvent) => {
      event.preventDefault();
      if (draggedItem === templateName) return;
      
      const fromIndex = templates.findIndex((template) => template.name === draggedItem);
      const toIndex = templates.findIndex((template) => template.name === templateName);
      
      draggedOverItem = templateName;
      isDraggingUp = fromIndex > toIndex;
    };
  }

  function handleDragLeave() {
    draggedOverItem = null;
    isDraggingUp = false;
  }

  function handleDrop(templateName: string) {
    return (event: DragEvent) => {
      event.preventDefault();
      if (!draggedItem || draggedItem === templateName) return;

      const fromIndex = templates.findIndex((template) => template.name === draggedItem);
      const toIndex = templates.findIndex((template) => template.name === templateName);

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
      isDraggingUp = false;
    };
  }

  function handleRename(templateName: string) {
    popupInput(
      "Rename Template",
      async (newName: string) => {
        if (newName === templateName) {
          return {};
        }

        const existingTemplate = templates.find(
          (template) => template.name === newName
        );
        if (existingTemplate) {
          popup({
            id: "confirm-rename-override",
            title: "Template already exists",
            message:
              "A template with this name already exists. Do you want to override it?",
            onAccept: async () => {
              await onRename(templateName, newName);
            },
            acceptMessage: "Override",
            closeMessage: "Cancel",
          });
        } else {
          await onRename(templateName, newName);
        }
        return {};
      },
      templateName,
      {
        id: `rename-template-${templateName}`,
        message: "Enter new name",
        isSaveClose: true,
        saveButtonTitle: "Rename",
      }
    );
  }
</script>

<div class="flex flex-col card shadow-md max-w-max">
  <SaveTemplateButton {templates} {onSave} />
  <hr />
  {#each templates as template}
    <TemplateListItem
      {template}
      {onSelect}
      onRename={handleRename}
      {onDelete}
      {onFavorite}
      isDragging={draggedItem === template.name}
      isDraggedOver={draggedOverItem === template.name}
      {isDraggingUp}
      handleDragStart={handleDragStart(template.name)}
      handleDragOver={handleDragOver(template.name)}
      {handleDragLeave}
      handleDrop={handleDrop(template.name)}
    />
  {/each}
</div>
