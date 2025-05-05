<!-- TipTap editor integration:  
https://tiptap.dev/
https://tiptap.dev/docs/editor/getting-started/install/svelte
 -->

<script lang="ts">
  import './EmailEditor.css';
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Color } from '@tiptap/extension-color';
  import ListItem from '@tiptap/extension-list-item';
  import TextStyle from '@tiptap/extension-text-style';
  import Image from '@tiptap/extension-image';
  import { popupClose } from '../../../functionality/popup/popup-logic';
  import { POPUP_TEMPLATE_MANAGER, type TEmailTemplate } from './email-template.types';
  import { toastError, toastNormal } from '../../../functionality/toast/toast-logic';
  import type { TResource } from '../../../../backend/user-crud/types';
  import { createFormContext, formField } from '../../../';
  import { VALIDATOR_REQUIRE_STRING } from '../../../../common';
  import FieldError from '../../../forms/FieldError.svelte';
  import EmailToolbar from './components/EmailToolbar.svelte';
  import EmailAttachments from './components/EmailAttachments.svelte';
  import { emailEditorStore } from './email-editor.store';
  import EmailTemplateManagerButton from './components/EmailTemplateManagerButton.svelte';

  const formContext = createFormContext();

  let element: HTMLElement;
  let editor: Editor;

  $: $emailEditorStore;

  function handleTemplateSelect(template: TResource<TEmailTemplate>) {
    popupClose(POPUP_TEMPLATE_MANAGER);
    toastNormal(`Template ${template.resourceId} applied`);
    emailEditorStore.updateAttachedFiles(template.data.attachedFiles || []);
    emailEditorStore.updateHtmlBody(template.data.content);
    editor?.chain().focus().setContent(template.data.content).run();
  }

  // --- Draft Save/Load/Helpers ---
  const DRAFT_KEY = 'email-editor-draft';
  function saveDraft(subject: string, body: string) {
    if (!subject && !body) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, body }));
    } catch (error) {
      // Handle quota exceeded error
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22)
      ) {
        toastError(
          'Email content is too large to save as draft. Please make the email body shorter or use smaller/fewer images.'
        );

        // Try to save just the subject without the body to preserve some state
        try {
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ subject, body: 'Content too large to save' })
          );
        } catch {
          // If even that fails, just log it
          console.error('Failed to save even minimal draft content');
        }
      } else {
        console.error('Error saving draft:', error);
      }
    }
  }
  function loadDraft() {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.subject) emailEditorStore.updateSubject(draft.subject);
      if (draft.body && editor?.commands?.setContent) {
        editor.commands.setContent(draft.body);
        emailEditorStore.updateHtmlBody(draft.body);
      }
    } catch {}
  }
  // Simple debounce helper
  function debounce(fn: (...args: any[]) => void, ms: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  }
  // Debounced save
  const debouncedSaveDraft = debounce(
    (subject: string, body: string) => saveDraft(subject, body),
    1200
  );

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        Color.configure({ types: [TextStyle.name, ListItem.name] }),
        TextStyle,
        StarterKit,
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
      ],
      content: ``,
      onTransaction: () => {
        // PATCH: force re-render so `editor.isActive` works as expected
        editor = editor;
      },
      onUpdate({ editor }) {
        const htmlBody = editor.getHTML();
        emailEditorStore.updateHtmlBody(htmlBody);
        debouncedSaveDraft($emailEditorStore.subject, htmlBody);
      },
      onCreate: () => {
        loadDraft();
      },
    });
  });

  // Save draft when subject changes (debounced)
  $: if (editor && editor.getHTML) {
    debouncedSaveDraft($emailEditorStore.subject, editor.getHTML());
  }

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="email-editor">
  <div class="flex justify-between items-center"></div>

  {#if editor}
    <div class="flex justify-between items-center gap-2">
      <div class="w-full">
        <label class="" for="subject"><small>Subject</small></label>
        <input
          class="input"
          name="subject"
          type="text"
          bind:value={$emailEditorStore.subject}
          on:input={(e) =>
            emailEditorStore.updateSubject(
              //@ts-ignore
              e.target.value
            )}
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
          selectedFiles={$emailEditorStore.attachedFiles}
        />
      </div>
    </div>

    <EmailAttachments
      fileSizeLimitExceeded={$emailEditorStore.fileSizeLimitExceeded}
      selectedFiles={$emailEditorStore.attachedFiles}
      totalFileSizeMB={$emailEditorStore.totalFileSizeMB}
      onFileChange={(files) => emailEditorStore.updateAttachedFiles(files)}
      onRemoveFile={(idx) => {
        const files = $emailEditorStore.attachedFiles
          .slice(0, idx)
          .concat($emailEditorStore.attachedFiles.slice(idx + 1));
        emailEditorStore.updateAttachedFiles(files);
      }}
    />

    <EmailToolbar bind:editor />
  {/if}
  <hr />
  <h2 class="mt-2 text-left">Email Body</h2>
  <div class="textarea mt-2 bg-surface-50" bind:this={element} />

  {#if $emailEditorStore.bodyTooLarge}
    <div
      class="bg-error-100 border border-error-400 text-error-700 px-4 py-3 rounded mt-2"
      role="alert"
    >
      <p>
        Email body size: {$emailEditorStore.emailBodySizeMB.toFixed(2)} MB (exceeds 20 MB limit)
      </p>
      <p>
        Please reduce the email body size by using fewer images or smaller images, or by using
        Google Drive links.
      </p>
    </div>
  {/if}
</div>
