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
  import { UCrudResourceClient } from '../../../user-crud/user-crud.client';
  import TemplateVariablesEditor from '../../../components/template-variables/TemplateVariablesEditor.svelte';

  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;

  const formContext = createFormContext();

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
      }
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
          {emailTemplateUCrudClient}
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
  <div class="flex justify-between items-center mt-2">
    <h2 class="text-left">Email Body</h2>
    <div class="flex gap-2">
      <button
        class="btn btn-sm {!$isHtmlMode ? 'variant-filled-primary' : 'variant-outline-primary'}"
        on:click={() => isHtmlMode.set(false)}
      >
        Simple Mode
      </button>
      <button
        class="btn btn-sm {$isHtmlMode ? 'variant-filled-primary' : 'variant-outline-primary'}"
        on:click={() => {
          console.log('btch');
          if (!$isHtmlMode && editor !== undefined) {
            // When switching to HTML mode, update textarea with current HTML
            htmlTextarea.value = editor.getHTML();
          }
          isHtmlMode.set(true);
        }}
      >
        HTML Mode
      </button>
    </div>
  </div>

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

  <!-- Template Variables Section -->
  {#if $emailEditorStore.templateVariables.length > 0}
    <div class="mt-6 p-4 border border-surface-300 rounded-lg">
      <h3 class="text-lg font-semibold mb-3">Template Variables</h3>
      <p class="text-sm mb-4">
        These variables were found in your email template. Enter values to replace them in the
        email.
      </p>
      
      <TemplateVariablesEditor 
        variables={$emailEditorStore.templateVariables}
        values={$emailEditorStore.templateVariableValues}
        on:change={(event) => {
          // Update the variable value in the store
          emailEditorStore.updateTemplateVariableValue(
            event.detail.variable,
            event.detail.value || ''
          );
          
          // Save draft with updated variables
          emailEditorStore.debouncedSaveDraft(
            $emailEditorStore.subject,
            $emailEditorStore.htmlBody,
            $emailEditorStore.templateVariableValues
          );
        }}
      />
    </div>
  {/if}
</div>
