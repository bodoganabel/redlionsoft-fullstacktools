<script lang="ts">
  import IconRectangles from '../../../../icons/IconRectangles.svelte';
  import { popup } from '../../../../functionality/popup/popup-logic';
  import EmailTemplateManager from '../EmailTemplateManager.svelte';
  import { POPUP_TEMPLATE_MANAGER } from '../email-template.types';
  import type { Editor } from '@tiptap/core';
  import type { TResource } from '../../../../../backend/user-crud/types';
  import type { TEmailTemplate } from '../email-template.types';
  import { UCrudResourceClient } from '../../../../user-crud/user-crud.client';

  export let selectedFiles: File[];
  export let editor: Editor;
  export let handleTemplateSelect: (template: TResource<TEmailTemplate>) => void;
  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;

  function openTemplateManager() {
    popup({
      title: 'Email Templates',
      id: POPUP_TEMPLATE_MANAGER,
      component: EmailTemplateManager,
      componentProps: {
        currentDraftEmailContent: editor?.getHTML?.() ?? '',
        currentDraftAttachedFiles: selectedFiles,
        onTemplateSelect: handleTemplateSelect,
        emailTemplateUCrudClient,
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
