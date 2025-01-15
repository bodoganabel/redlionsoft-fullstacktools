<script lang="ts">
  import IconEdit from "../../icons/IconEdit.svelte";
  import IconTrash from "../../icons/IconTrash.svelte";
  import IconDragHandle from "../../icons/IconDragHandle.svelte";
  import type { TTemplate } from "./template.types";

  export let template: TTemplate;
  export let onSelect: (name: string) => Promise<void>;
  export let onRename: (name: string) => void;
  export let onDelete: (name: string) => Promise<void>;
  export let onFavorite: (name: string) => Promise<void>;
  export let isDragging = false;
  export let isDraggedOver = false;
  export let isDraggingUp = false;

  export let handleDragStart: (event: DragEvent) => void;
  export let handleDragOver: (event: DragEvent) => void;
  export let handleDragLeave: () => void;
  export let handleDrop: (event: DragEvent) => void;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="px-2 flex justify-stretch items-center w-full group hover:bg-surface-200-700-token cursor-move"
  class:opacity-50={isDragging}
  class:border-b-2={isDraggedOver}
  class:border-primary-500={isDraggedOver}
  draggable="true"
  on:dragstart={handleDragStart}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <button
    on:click={() => onFavorite(template.name)}
    class="btn-icon w-5 h-5 {template.isFavorite
      ? ''
      : 'invisible group-hover:visible'} transition-none"
  >
    {template.isFavorite ? "★" : "☆"}
  </button>

  <button on:click={() => onSelect(template.name)} class="w-full text-left">
    <div class="w-full text-left">
      {template.name}
    </div>
  </button>

  <div
    class="drag-handle btn-icon w-5 h-5 invisible group-hover:visible transition-none"
  >
    <IconDragHandle />
  </div>

  <button
    on:click={() => onRename(template.name)}
    class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
  >
    <IconEdit />
  </button>

  <button
    on:click={() => onDelete(template.name)}
    class="ml-1 btn-icon w-5 h-5 invisible group-hover:visible transition-none"
  >
    <IconTrash />
  </button>
</div>
