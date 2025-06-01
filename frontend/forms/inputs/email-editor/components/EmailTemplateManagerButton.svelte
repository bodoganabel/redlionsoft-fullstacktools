<script lang="ts">
  import IconRectangles from '../../../../icons/IconRectangles.svelte';
  import { popup } from '../../../../functionality/popup/popup-logic';
  import EmailTemplateManager from '../EmailTemplateManager.svelte';
  import { POPUP_TEMPLATE_MANAGER } from '../email-template.types';
  import type { Editor } from '@tiptap/core';
  import type { TResource } from '../../../../../backend/user-crud/types';
  import type { TEmailTemplate } from '../email-template.types';
  import { UCrudResourceClient } from '../../../../user-crud/user-crud.client';

  import { emailEditorStore } from '../email-editor.store';
  export let editor: Editor;
  export let handleTemplateSelect: (template: TResource<TEmailTemplate>) => Promise<void>;
  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;
  export let isHtmlMode = false;
  export let htmlTextareaContent: string = '';

  function openTemplateManager() {
    // Determine the current content based on mode
    const currentContent = isHtmlMode ? htmlTextareaContent : (editor?.getHTML?.() ?? '');

    console.log('Opening template manager with:', {
      isHtmlMode,
      htmlTextareaContent,
      currentContent,
    });

    popup({
      title: 'Email Templates',
      id: POPUP_TEMPLATE_MANAGER,
      component: EmailTemplateManager,
      componentProps: {
        // Always pass the correct content based on active mode
        currentDraftEmailContent: currentContent,
        currentDraftEmailSubject: $emailEditorStore.subject,
        currentDraftAttachedFiles: $emailEditorStore.attachedFiles,
        onTemplateSelect: handleTemplateSelect,
        emailTemplateUCrudClient,
        isHtmlMode,
        htmlTextareaContent,
      },
      isOutsideClickClose: true,
    });
  }
</script>

<button
  lang="ts"
  class="btn-icon p-1 w-10 h-10 text-sm variant-filled-secondary rounded-lg flex items-center gap-2"
  on:click={openTemplateManager}
>
  <IconRectangles />
</button>
