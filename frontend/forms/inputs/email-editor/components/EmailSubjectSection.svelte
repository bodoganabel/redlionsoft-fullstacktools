<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { emailEditorStore } from '../email-editor.store';
  import { VALIDATOR_REQUIRE_STRING } from '../../../../../common';
  import FieldError from '../../../FieldError.svelte';
  import { createFormContext, formField } from '../../../form';
  import EmailTemplateManagerButton from './EmailTemplateManagerButton.svelte';
  import { type TResource } from '../../../../../backend/user-crud/types';
  import { POPUP_TEMPLATE_MANAGER, type TEmailTemplate } from '../email-template.types';
  import { popupClose } from '../../../../functionality/popup/popup-logic';
  import { toastNormal } from '../../../../functionality/toast/toast-logic';
  import { UCrudResourceClient } from '../../../../user-crud/user-crud.client';
  import { type Writable } from 'svelte/store';

  export let editor: Editor;
  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;
  export let isHtmlMode: Writable<boolean>;
  export let htmlTextareaContent: string;

  const formContext = createFormContext();

  async function handleTemplateSelect(template: TResource<TEmailTemplate>) {
    popupClose(POPUP_TEMPLATE_MANAGER);
    toastNormal(`Template ${template.resourceId} applied`);
    emailEditorStore.updateHtmlBody(template.data.content);
    // Always update the subject - if it doesn't exist in the template, set it to empty string
    emailEditorStore.updateSubject(template.data.subject || '');
    editor?.chain().focus().setContent(template.data.content).run();
  }
</script>

<div class="flex justify-between items-center gap-2">
  <div class="w-full">
    <label class="" for="subject"><small>Subject</small></label>
    <input
      class="input"
      name="subject"
      type="text"
      value={$emailEditorStore.subject}
      on:input={(e) => emailEditorStore.updateSubject(e.currentTarget.value)}
      use:formField={{
        formContext,
        validators: [VALIDATOR_REQUIRE_STRING('Subject is required')],
      }}
    />
    <FieldError name="subject" {formContext} />
  </div>
  <div class="">
    <EmailTemplateManagerButton
      bind:editor
      {handleTemplateSelect}
      {emailTemplateUCrudClient}
      isHtmlMode={$isHtmlMode}
      {htmlTextareaContent}
    />
  </div>
</div>
