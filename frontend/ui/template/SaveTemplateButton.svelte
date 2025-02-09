<script lang="ts">
  import type { TTemplate } from "./template.types";
  import { popupInput, popup } from "../../functionality/popup/popup-logic";

  export let templates: TTemplate[];
  export let onSave: (name: string) => Promise<void>;

  async function handleSave() {
    popupInput({
      title: "Save Template",
      onSave: async (templateName: string) => {
        const existingTemplate = templates.find(
          (template) => template.name === templateName
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
      initialValue: "",
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
