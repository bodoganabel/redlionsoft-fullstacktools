<script lang="ts">
  import { onMount } from 'svelte';
  let nameInput: HTMLInputElement;

  onMount(() => {
    if (nameInput) {
      nameInput.focus();
      const len = nameInput.value.length;
      nameInput.setSelectionRange(len, len);
    }
  });
  import InfoCardRls from '$redlionsoft/frontend/elements/InfoCardRls.svelte';
  import { POPUP_EMAIL_TEMPLATE_EDIT_ID, type TEmailTemplate } from './email-template.types';
  import { popup, popupClose } from '$redlionsoft/frontend/functionality/popup/popup-logic';
  import { toastError } from '$redlionsoft/frontend/functionality/toast/toast-logic';
  import { emailTemplateUCrudClient } from '$src/routes/(private)/email-templates/client';
  import type { TResource } from '$redlionsoft/backend/user-crud/types';

  export let originalTemplate: TResource<TEmailTemplate>;
  export let emailContent: string;
  export let attachedFiles: File[];
  export let initialTemplateName: string;
  export let existingTemplates: TResource<TEmailTemplate>[];
  export let isNewTemplate: boolean;
  export let isOverwriteContent: boolean;

  $: overwriteMessage = isOverwriteContent
    ? "<small class='text-error-500'>This will overwrite the template's content with the current email draft and attachments.</small>"
    : '<small>This will not replace the content with the current content of the template.</small>';

  let templateName = initialTemplateName;

  async function onTemplateSave(templateData: TEmailTemplate): Promise<void> {
    console.log('onTemplateSave');
    if (templateName === '') {
      toastError('Template name cannot be empty');
      return;
    }
    if (isNewTemplate) {
      await emailTemplateUCrudClient.saveResource(templateName, templateData);
    } else {
      console.log('templateData,originalTemplate.data:');
      console.log(templateData, originalTemplate.data);
      await emailTemplateUCrudClient.updateResource(
        initialTemplateName,
        templateName,
        isOverwriteContent ? templateData : originalTemplate.data
      );
    }
    popupClose(POPUP_EMAIL_TEMPLATE_EDIT_ID);
  }
</script>

<div class="flex flex-col">
  <form class="flex flex-col gap-4" autocomplete="off">
    <div class="flex justify-between items-end">
      <div class="flex flex-col gap-2">
        <label for="template-name" class="text-sm font-medium">Template name</label>
        <input
          id="template-name"
          type="text"
          class="input input-bordered w-full"
          placeholder="Enter template name"
          bind:value={templateName}
          bind:this={nameInput}
        />
      </div>
    </div>
    {#if !isNewTemplate}
      <!-- content here -->
      <div class="flex justify-start items-start gap-1">
        <input
          type="checkbox"
          id="overwrite-content"
          class="mt-1 checkbox checkbox-primary"
          bind:checked={isOverwriteContent}
        />
        <label for="overwrite-content" class="text-sm"
          >Overwrite template content with current draft email</label
        >
      </div>
    {/if}
  </form>

  <div class="mt-3">
    <InfoCardRls>
      <small class="explanation">
        <span class="text-yellow-500 ml-1">*</span> Attached files will not be saved with the template
        - use Google Drive links instead
      </small>
    </InfoCardRls>
  </div>

  <div class="mt-5 flex justify-end items-center space-x-2">
    <button
      on:click={async () => {
        popupClose(POPUP_EMAIL_TEMPLATE_EDIT_ID);
      }}
      type="button"
      class="btn variant-outline-primary self-start">Cancel</button
    >
    <button
      on:click={() => {
        if (existingTemplates.find((template) => template.resourceId === templateName)) {
          popup({
            title: 'Update Template',
            id: 'edit-template-overwrite-confirm',
            message: `Are you sure you want to overwrite template ${templateName}? <br/> ${overwriteMessage}`,
            isOutsideClickClose: true,
            onAccept: async () => {
              onTemplateSave({
                content: emailContent,
                attachedFiles,
                isShared: false,
                ownerUserId: 'NOT_IMPLEMENTED_YET',
              });
              popupClose(POPUP_EMAIL_TEMPLATE_EDIT_ID);
            },
            onClose: () => {},
            acceptMessage: 'Overwrite',
            closeMessage: 'Cancel',
          });
        } else {
          onTemplateSave({
            content: emailContent,
            attachedFiles,
            isShared: false,
            ownerUserId: 'NOT_IMPLEMENTED_YET',
          });
        }
      }}
      type="button"
      class="btn variant-filled-primary self-start"
      >{existingTemplates.find((template) => template.resourceId === templateName)
        ? 'Update template'
        : 'Save template'}</button
    >
  </div>
</div>
