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
  import { type TEmailTemplate } from './email-template.types';
  import EmailToolbar from './components/EmailToolbar.svelte';
  import EmailAttachments from './components/EmailAttachments.svelte';
  import { emailEditorStore } from './email-editor.store';
  import { UCrudResourceClient } from '../../../user-crud/user-crud.client';
  import TemplateVariablesEditor from '../../../components/template-variables/TemplateVariablesEditor.svelte';
  import EmailErrorBodyTooLarge from './components/EmailErrorBodyTooLarge.svelte';
  import EmailEditModeSelector from './components/EmailEditModeSelector.svelte';
  import EmailSubjectSection from './components/EmailSubjectSection.svelte';
  import { debouncedSaveDraft, loadDraft } from './components/utilis';

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

  // Avoid redundant variable detection
  let contentChanged = false;
  let initialDetectionDone = false;
  
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
        // Only update HTML body if it actually changed
        if (htmlBody !== $emailEditorStore.htmlBody) {
          contentChanged = true;
          emailEditorStore.updateHtmlBody(htmlBody);
          debouncedSaveDraft($emailEditorStore.subject, htmlBody);

          // If we're in HTML mode, update the textarea
          if ($isHtmlMode && htmlTextarea) {
            htmlTextarea.value = htmlBody;
          }
        }
      },
      onCreate: () => {
        // Use the store's loadDraft function directly
        emailEditorStore.loadDraft({
          setSubject: (subject: string) => {
            emailEditorStore.updateSubject(subject);
          },
          setHtmlBody: (htmlBody: string) => {
            if (editor?.commands?.setContent) {
              editor.commands.setContent(htmlBody);
              emailEditorStore.updateHtmlBody(htmlBody);
              initialDetectionDone = false; // Will trigger detection after setup
            }
          },
          setTemplateVariableValues: (values: Record<string, string>) => {
            // The store will handle updating the template variable values
            Object.entries(values).forEach(([variable, value]) => {
              emailEditorStore.updateTemplateVariableValue(variable, value as string);
            });
          },
          setIsHtmlMode: (mode: boolean) => {
            isHtmlMode.set(mode);
          }
        });
      },
    });
  });

  // Run template variable detection only once after the editor is fully initialized
  onMount(() => {
    // Use a short delay to ensure the editor is fully initialized
    setTimeout(() => {
      if (editor && !initialDetectionDone) {
        initialDetectionDone = true;
        emailEditorStore.detectTemplateVariables();
      }
    }, 500);
  });

  // Save draft when subject changes (debounced)
  $: if (editor && editor.getHTML) {
    emailEditorStore.debouncedSaveDraft(
      $emailEditorStore.subject,
      editor.getHTML(),
      $emailEditorStore.templateVariableValues,
      $isHtmlMode
    );
  }

  // Save draft when HTML mode changes
  $: {
    if (editor && editor.getHTML) {
      emailEditorStore.debouncedSaveDraft(
        $emailEditorStore.subject,
        editor.getHTML(),
        $emailEditorStore.templateVariableValues,
        $isHtmlMode
      );
    }
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
      contentChanged = true; // This will trigger variable detection
    }
  }

  // Detect variables only when content has been changed
  $: if (contentChanged && editor) {
    contentChanged = false;
    emailEditorStore.debouncedDetectVariables();
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
        contentChanged = true; // Will trigger detection via reactive statement
      }
    }}
  />
  <div class="textarea mt-2 bg-surface-50" bind:this={element} class:hidden={$isHtmlMode} />

  <EmailErrorBodyTooLarge />
  <TemplateVariablesEditor />
</div>
