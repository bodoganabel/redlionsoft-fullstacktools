<script lang="ts">
  import { onMount } from 'svelte';
  import { POPUP_EMAIL_TEMPLATE_EDIT_ID, type TEmailTemplate } from './email-template.types';
  import IconTrash from '../../../icons/IconTrash.svelte';
  import { popup } from '../../../functionality/popup/popup-logic';
  import IconEdit from '../../../icons/IconEdit.svelte';
  import EditEmailTemplate from './EditEmailTemplate.svelte';
  import { toastError, toastSuccess } from '../../../functionality/toast/toast-logic';
  import IconDragHandle from '../../../icons/IconDragHandle.svelte';
  import type { TResource } from '../../../../backend/user-crud/types';
  import SpinnerRls from '../../../elements/SpinnerRls.svelte';
  import { UCrudResourceClient } from '../../../user-crud/user-crud.client';

  export let currentDraftEmailContent: string;
  export let currentDraftEmailSubject: string = '';
  export let currentDraftAttachedFiles: File[];
  export let onTemplateSelect: (template: TResource<TEmailTemplate>) => Promise<void>;
  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;
  export let isHtmlMode = false;
  export let htmlTextareaContent: string = '';

  onMount(async () => {
    console.log('currentDraftAttachedFiles - just after opening popup:');
    console.log(currentDraftAttachedFiles);
  });

  let existingTemplates: TResource<TEmailTemplate>[] = [];
  let isLoadingEmailTemplates = true;

  // Drag & drop state
  let draggedItem: string | null = null;
  let draggedOverItem: string | null = null;
  let isDraggingUp = false;
  let dragOverPosition: 'above' | 'below' | null = null;
  let dragOverResourceId: string | null = null;
  let lastDragOverResourceId: string | null = null;
  let lastDragOverPosition: 'above' | 'below' | null = null;

  function handleDragStart(resourceId: string) {
    return (event: DragEvent) => {
      if (!event.dataTransfer) return;
      draggedItem = resourceId;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', resourceId);
      draggedOverItem = null;
      isDraggingUp = false;
    };
  }

  function handleDragOver(resourceId: string) {
    return (event: DragEvent) => {
      event.preventDefault();
      if (draggedItem === resourceId) return;
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const offset = event.clientY - rect.top;
      const hysteresis = 6; // px buffer for dead zone elimination
      let position: 'above' | 'below';
      if (offset < rect.height / 2 - hysteresis) {
        position = 'above';
      } else if (offset > rect.height / 2 + hysteresis) {
        position = 'below';
      } else {
        // In the hysteresis zone, do NOT update the drop target/indicator
        dragOverResourceId = lastDragOverResourceId;
        dragOverPosition = lastDragOverPosition;
        draggedOverItem = lastDragOverResourceId;
        return;
      }
      dragOverResourceId = resourceId;
      dragOverPosition = position;
      draggedOverItem = resourceId;
      lastDragOverResourceId = resourceId;
      lastDragOverPosition = position;
    };
  }

  function handleDragLeave() {
    draggedOverItem = null;
    dragOverPosition = null;
    isDraggingUp = false;
  }

  function handleDrop(resourceId: string) {
    return (event: DragEvent) => {
      event.preventDefault();
      if (!draggedItem || draggedItem === resourceId) return;
      const fromIndex = existingTemplates.findIndex((t) => t.resourceId === draggedItem);
      const toIndex = existingTemplates.findIndex((t) => t.resourceId === resourceId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const updated = [...existingTemplates];
        const [moved] = updated.splice(fromIndex, 1);
        let insertIndex = toIndex;
        if (dragOverPosition === 'below') {
          insertIndex = toIndex + (fromIndex < toIndex ? 0 : 1);
        } else {
          insertIndex = toIndex;
        }
        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > updated.length) insertIndex = updated.length;
        updated.splice(insertIndex, 0, moved as any);
        existingTemplates = updated;
        // Persist new order to backend using ucrud client
        const reorderedItems = updated.map((t, i) => ({
          resourceId: t.resourceId,
          order: updated.length - 1 - i,
        }));
        emailTemplateUCrudClient.reorderResources(reorderedItems).then((ok: any) => {
          if (ok) {
            toastSuccess('Template order updated');
          } else {
            toastError('Failed to update template order');
          }
        });
      }
      draggedItem = null;
      draggedOverItem = null;
      dragOverResourceId = null;
      dragOverPosition = null;
      isDraggingUp = false;
    };
  }

  onMount(async () => {
    existingTemplates = await emailTemplateUCrudClient.loadResources();
    isLoadingEmailTemplates = false;
  });
</script>

<div class="flex flex-col">
  <div class="mt-3">
    {#if currentDraftEmailContent !== '<p></p>' || currentDraftAttachedFiles.length !== 0}
      <button
        on:click={async (e) => {
          e.stopPropagation();
          // Determine the content to use based on mode
          const contentToUse = isHtmlMode ? htmlTextareaContent : currentDraftEmailContent;
          
          console.log('Save current draft clicked with:', {
            isHtmlMode,
            htmlTextareaContent,
            currentDraftEmailContent,
            contentToUse
          });
          
          popup({
            title: 'Save template',
            id: POPUP_EMAIL_TEMPLATE_EDIT_ID,
            component: EditEmailTemplate,
            componentProps: {
              originalTemplate: {
                resourceId: '',
                data: {
                  subject: currentDraftEmailSubject,
                  content: contentToUse,
                  attachedFiles: currentDraftAttachedFiles,
                  isShared: false,
                  ownerUserId: 'NOT_IMPLEMENTED_YET',
                },
              },
              emailContent: contentToUse,
              emailSubject: currentDraftEmailSubject,
              attachedFiles: currentDraftAttachedFiles,
              existingTemplates,
              initialTemplateName: '',
              isNewTemplate: true,
              isOverwriteContent: true,
              emailTemplateUCrudClient,
              isHtmlMode,
              htmlTextareaContent,
            },
            isOutsideClickClose: true,
            isEnterAccept: false,
          });
        }}
        type="button"
        class="btn variant-filled-primary self-start">Save current draft as template</button
      >

      <h2 class="mt-3 text-left">Existing templates</h2>
    {/if}
    <div class="flex flex-col gap-0">
      {#if isLoadingEmailTemplates}
        <div class="mt-3 flex justify-center items-center size-8">
          <SpinnerRls />
        </div>
      {/if}
      {#each existingTemplates as template}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="flex justify-between items-center group {draggedItem === template.resourceId
            ? 'opacity-50'
            : ''}"
          draggable="true"
          on:dragstart={handleDragStart(template.resourceId)}
          on:dragover={handleDragOver(template.resourceId)}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop(template.resourceId)}
          style="position: relative; padding: 0.5rem 0;"
        >
          {#if dragOverResourceId === template.resourceId && dragOverPosition === 'above'}
            <div
              style="position: absolute; left: 0; right: 0; top: 0; height: 0; border-top: 3px solid #000; z-index: 10;"
            ></div>
          {/if}
          {#if dragOverResourceId === template.resourceId && dragOverPosition === 'below'}
            <div
              style="position: absolute; left: 0; right: 0; bottom: 0; height: 0; border-bottom: 3px solid #000; z-index: 10;"
            ></div>
          {/if}
          <button
            on:click={() => {
              if (template) {
                onTemplateSelect(template);
              }
            }}
            class="card flex flex-row flex-1 justify-between items-center p-3 bg-neutral-50 border border-neutral-200 rounded-lg shadow-xs"
          >
            <div class="flex-1 font-medium text-left">{template.resourceId}</div>
          </button>
          <div class="drag-handle btn-icon w-5 h-5 invisible group-hover:visible transition-none">
            <IconDragHandle />
          </div>
          <button
            type="button"
            on:click={async (e) => {
              e.stopPropagation();
              console.log('Edit template clicked for:', {
                template,
                isHtmlMode,
                htmlTextareaContent
              });
              popup({
                title: 'Edit template',
                id: POPUP_EMAIL_TEMPLATE_EDIT_ID,
                component: EditEmailTemplate,
                componentProps: {
                  originalTemplate: template,
                  emailContent: template.data.content,
                  emailSubject: template.data.subject,
                  attachedFiles: template.data.attachedFiles || [],
                  existingTemplates,
                  isNewTemplate: false,
                  initialTemplateName: template.resourceId,
                  isOverwriteContent: false,
                  emailTemplateUCrudClient,
                  isHtmlMode,
                  htmlTextareaContent,
                },
                isOutsideClickClose: true,
                isEnterAccept: false,
              });
            }}
            class="btn-icon size-5"><IconEdit /></button
          >
          <button
            type="button"
            on:click={(e) => {
              e.stopPropagation();
              popup({
                title: 'Delete template',
                id: 'delete-template',
                message: `Are you sure you want to delete ${template.resourceId}?`,
                componentProps: {
                  template,
                },
                onAccept: async () => {
                  await emailTemplateUCrudClient.deleteResource(template);
                  existingTemplates = await emailTemplateUCrudClient.loadResources();
                  toastSuccess(`Template ${template.resourceId} deleted`);
                },
                onClose: () => {},
                isOutsideClickClose: true,
              });
            }}
            class="btn-icon size-5 text-error-500"><IconTrash /></button
          >
        </div>
      {/each}
    </div>
  </div>
</div>
