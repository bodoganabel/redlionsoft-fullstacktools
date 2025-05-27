<!-- TipTap editor integration:  
https://tiptap.dev/
https://tiptap.dev/docs/editor/getting-started/install/svelte
 -->

<script lang="ts">
  import './EmailEditor.css';
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Color } from '@tiptap/extension-color';
  import ListItem from '@tiptap/extension-list-item';
  import TextStyle from '@tiptap/extension-text-style';
  import Image from '@tiptap/extension-image';
  import { popup, popupClose } from '../../../functionality/popup/popup-logic';
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
  import { UCrudResourceClient } from '../../../user-crud/user-crud.client';
  import TemplateVariablesEditor from '../../../components/template-variables/TemplateVariablesEditor.svelte';
  import EmailErrorBodyTooLarge from './components/EmailErrorBodyTooLarge.svelte';
  import EmailEditModeSelector from './components/EmailEditModeSelector.svelte';
  import EmailSubjectSection from './components/EmailSubjectSection.svelte';

  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;

  let element: HTMLElement;
  let editor: Editor;

  // HTML mode toggle
  let isHtmlMode = writable(false);
  let htmlTextarea: HTMLTextAreaElement;

  /**
   * Update the HTML content by replacing variables with their values
   */
  function updateHtmlWithVariableValues(html: string, values: Record<string, string>): string {
    let updatedHtml = html;

    Object.entries(values).forEach(([variable, value]) => {
      const regex = new RegExp(`\{\{${variable}\}\}`, 'g');
      updatedHtml = updatedHtml.replace(regex, value || `{{${variable}}}`);
    });

    return updatedHtml;
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
    emailEditorStore.loadDraft({
      setSubject: (subject) => emailEditorStore.updateSubject(subject),
      setHtmlBody: (htmlBody) => {
        if (editor?.commands?.setContent) {
          editor.commands.setContent(htmlBody);
          emailEditorStore.updateHtmlBody(htmlBody);
        }
      },
      setTemplateVariableValues: (values) => {
        // The store will handle updating the template variable values
        Object.entries(values).forEach(([variable, value]) => {
          emailEditorStore.updateTemplateVariableValue(variable, value);
        });
      },
    });
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
    // Initialize the editor
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

        // If we're in HTML mode, update the textarea
        if ($isHtmlMode && htmlTextarea) {
          htmlTextarea.value = htmlBody;
        }
      },
      onCreate: () => {
        loadDraft();
      },
    });
  });

  // Save draft when subject changes (debounced)
  $: if (editor && editor.getHTML) {
    emailEditorStore.debouncedSaveDraft(
      $emailEditorStore.subject,
      editor.getHTML(),
      $emailEditorStore.templateVariableValues
    );
  }

  // Handle HTML mode changes
  $: if ($isHtmlMode && htmlTextarea && editor) {
    // When in HTML mode, ensure textarea has current content
    htmlTextarea.value = $emailEditorStore.htmlBody;
  }

  // Apply HTML content to editor when switching back from HTML mode
  $: if (!$isHtmlMode && editor && htmlTextarea?.value) {
    // Only update if there's actual content and it differs from current
    if (htmlTextarea.value && htmlTextarea.value !== editor.getHTML()) {
      editor.commands.setContent(htmlTextarea.value);
      emailEditorStore.updateHtmlBody(htmlTextarea.value);
    }
  }

  // The store now automatically extracts variables when htmlBody is updated

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="email-editor">
  <div class="flex justify-between items-center"></div>

  {#if editor}
    <EmailSubjectSection
      bind:editor
      bind:emailTemplateUCrudClient
      bind:isHtmlMode
      htmlTextareaContent={htmlTextarea.value}
    />

    <EmailAttachments />

    <EmailToolbar bind:editor />
  {/if}
  <hr />
  <EmailEditModeSelector bind:isHtmlMode bind:editor bind:htmlTextarea />

  <textarea
    bind:this={htmlTextarea}
    class="textarea mt-2 bg-surface-50 font-mono text-sm"
    style="min-height: 300px; width: 100%;"
    class:hidden={!$isHtmlMode}
    on:input={(e) => {
      // Update the store when HTML is edited directly
      if ($isHtmlMode) {
        emailEditorStore.updateHtmlBody(e.currentTarget.value);
      }
    }}
  />
  <div class="textarea mt-2 bg-surface-50" bind:this={element} class:hidden={$isHtmlMode} />

  <EmailErrorBodyTooLarge />
  <TemplateVariablesEditor />
</div>
