<script lang="ts">
  import { popupInput, popup } from "../../functionality/popup/popup-logic";
  import type { TFilterTemplateResource } from "../filter/filter.types";

  export let templates: TFilterTemplateResource[];
  export let onSave: (name: string) => Promise<void>;

  async function handleSave() {
    popupInput({
      title: "Save Template",
      onSave: async (templateName: string) => {
        const existingTemplate = templates.find(
          (template) => template.resourceId === templateName
        );

        if (existingTemplate) {
          popup({
            id: "confirm-overwrite",
            title: "Template already exists",
            message:
              "A template with this name already exists. Do you want to overwrite it?",
            onAccept: async () => {
              await onSave(templateName);
            },
            acceptMessage: "Overwrite",
            closeMessage: "Cancel",
          });
        } else {
          await onSave(templateName);
        }
      },
      value: "",
      id: "save-template-input",
      message: "Enter template name",
      isSaveClose: true,
      saveButtonTitle: "Save",
    });
  }
</script>

<div class="template-list-row">
  <button on:click={handleSave}>Save current as template</button>
</div>
