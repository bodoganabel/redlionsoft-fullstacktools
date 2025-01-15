<script lang="ts">
  import type { JsonField, FieldsPosition } from "./types";

  export let field: JsonField;
  export let fieldsPosition: FieldsPosition = "below-key";
  export let onChange: (path: string, value: string) => void;

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    onChange(field.path, target.value);
  };
</script>

<div
  class="flex {fieldsPosition === 'next-to-key'
    ? 'flex-row items-center gap-2'
    : 'flex-col'}"
  style="margin-left: {field.indentLevel * 20}px"
>
  <label class="text-sm font-medium text-gray-700 mb-1" for={field.path}>
    {field.displayName}
  </label>
  {#if !field.isObject}
    <input
      type="text"
      id={field.path}
      class="input"
      value={field.value}
      disabled={field.disabled}
      on:input={handleInput}
    />
  {/if}
</div>

<!-- Example usage:
<div>Json editor test</div>
    <JsonEditorRls
      displayMode="tree"
      fieldsPosition="next-to-key"
      returns="changed-object-full"
      initialData={{
        foo: "something2",
        deep: {
          inner1: {},
          inner2: {
            deepInner1: {
              value: "something2",
              value2: "other",
              arrie: [
                { hoppa: "hoppa", tr: true, number: 1 },
                { another: "another" },
                "string",
                234,
                true,
                undefined,
                null,
              ],
            },
            deepInner2: 7,
            deepInner3: true,
          },
        },
      }}
      onSave={console.log}
      hiddenFields={["_id"]}
      fieldAliases={{
        foo: "owyeah",
      }}
      disabledFields={[""]}
    /> 
-->
