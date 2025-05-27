<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  let nameInput: HTMLInputElement;

  onMount(() => {
    if (nameInput) {
      nameInput.focus();
      const len = nameInput.value.length;
      nameInput.setSelectionRange(len, len);
    }
    
    console.log('EditEmailTemplate onMount:', {
      isHtmlMode,
      htmlTextareaContent,
      emailContent,
      emailSubject,
      isOverwriteContent
    });
  });
  import { POPUP_EMAIL_TEMPLATE_EDIT_ID, type TEmailTemplate } from './email-template.types';
  import { popup, popupClose } from '../../../functionality/popup/popup-logic';
  import { toastError, toastSuccess } from '../../../functionality/toast/toast-logic';
  import type { TResource } from '../../../../backend/user-crud/types';
  import InfoCardRls from '../../../elements/InfoCardRls.svelte';
  import { UCrudResourceClient } from '../../../user-crud/user-crud.client';

  export let originalTemplate: TResource<TEmailTemplate>;
  export let emailContent: string;
  export let emailSubject: string = '';
  export let attachedFiles: File[];
  export let initialTemplateName: string;
  export let existingTemplates: TResource<TEmailTemplate>[];
  export let isNewTemplate: boolean;
  export let isOverwriteContent: boolean;
  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;
  export let isHtmlMode = false;
  export let htmlTextareaContent: string = '';

  $: overwriteMessage = isOverwriteContent
    ? "<small class='text-error-500'>This will overwrite the template's content with the current email draft, subject, and attachments.</small>"
    : '<small>This will not replace the content with the current content of the template.</small>';

  let templateName = initialTemplateName;

  async function onTemplateSave(templateData: TEmailTemplate): Promise<void> {
    if (templateName === '') {
      toastError('Template name cannot be empty');
      return;
    }
    
    // Determine content to save based on HTML mode
    const contentToSave = isHtmlMode ? htmlTextareaContent : templateData.content;
    
    // Create a complete template data object with all required fields
    const dataToSave: TEmailTemplate = {
      subject: templateData.subject,
      content: contentToSave,
      attachedFiles: templateData.attachedFiles,
      isShared: templateData.isShared || false,
      ownerUserId: templateData.ownerUserId || 'NOT_IMPLEMENTED_YET'
    };
    
    console.log('Saving template with data:', {
      templateName, 
      dataToSave,
      isOverwriteContent,
      isNewTemplate,
      isHtmlMode,
      htmlTextareaContent,
      originalContent: templateData.content
    });
    
    try {
      if (isNewTemplate) {
        const result = await emailTemplateUCrudClient.saveResource(templateName, dataToSave);
        if (result) {
          toastSuccess(`Template "${templateName}" saved successfully`);
        }
      } else {
        const dataToUpdate = isOverwriteContent ? dataToSave : originalTemplate.data;
        console.log('Updating with data:', dataToUpdate);
        
        const success = await emailTemplateUCrudClient.updateResource(
          initialTemplateName,
          templateName,
          dataToUpdate
        );
        
        if (success) {
          toastSuccess(`Template "${templateName}" updated successfully`);
        }
      }
      popupClose(POPUP_EMAIL_TEMPLATE_EDIT_ID);
    } catch (error) {
      console.error('Error saving template:', error);
      toastError('Failed to save template: ' + (error.message || 'Unknown error'));
    }
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
              console.log('Template overwrite confirmation accepted');
              onTemplateSave({
                subject: emailSubject,
                content: isHtmlMode ? htmlTextareaContent : emailContent,
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
          console.log('Template save (new) initiated');
          onTemplateSave({
            subject: emailSubject,
            content: isHtmlMode ? htmlTextareaContent : emailContent,
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
