<script lang="ts">
  import { popup, popupInput } from "../../functionality/popup/popup-logic";
  import SaveTemplateButton from "./SaveTemplateButton.svelte";
  import TemplateListItem from "./TemplateListItem.svelte";
  import type { TFilterTemplateResource } from "../filter/filter.types";

  export let templates: TFilterTemplateResource[] = [];
  export let onSelect: (template: TFilterTemplateResource) => Promise<void>;
  export let onRename: (
    template: TFilterTemplateResource,
    newName: string
  ) => Promise<void>;
  export let onDelete: (template: TFilterTemplateResource) => Promise<void>;
  export let onSave: (name: string) => Promise<void>;
  export let onFavorite: (template: TFilterTemplateResource) => Promise<void>;
  export let onReorder: (
    event: CustomEvent<{ resourceId: string; newIndex: number }>
  ) => Promise<void>;

  $: {
    templates = templates;
    console.log("templates from tls:");
    console.log(templates);
  }

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

      const fromIndex = templates.findIndex(
        (template) => template.resourceId === draggedItem
      );
      const toIndex = templates.findIndex(
        (template) => template.resourceId === templateName
      );

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

      const fromIndex = templates.findIndex(
        (template) => template.resourceId === draggedItem
      );
      const toIndex = templates.findIndex(
        (template) => template.resourceId === templateName
      );

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

  async function handleRename(template: TFilterTemplateResource) {
    popupInput({
      title: "Rename Template",
      onSave: async (newName: string) => {
        if (newName === template.resourceId) {
          return;
        }

        const existingTemplate = templates.find(
          (template) => template.resourceId === newName
        );
        if (existingTemplate) {
          popup({
            id: "confirm-rename-override",
            title: "Template already exists",
            message:
              "A template with this name already exists. Do you want to override it?",
            onAccept: async () => {
              await onRename(template, newName);
            },
            acceptMessage: "Override",
            closeMessage: "Cancel",
          });
        } else {
          await onRename(template, newName);
        }
      },
      value: template.resourceId,
      id: `rename-template-${template.resourceId}`,
      message: "Enter new name",
      isSaveClose: true,
      saveButtonTitle: "Rename",
    });
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
      isDragging={draggedItem === template.resourceId}
      isDraggedOver={draggedOverItem === template.resourceId}
      {isDraggingUp}
      handleDragStart={handleDragStart(template.resourceId)}
      handleDragOver={handleDragOver(template.resourceId)}
      {handleDragLeave}
      handleDrop={handleDrop(template.resourceId)}
    />
  {/each}
</div>
