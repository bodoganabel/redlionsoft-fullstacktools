<!-- Subject input with validation and error display -->
<script lang="ts">
  import { formField } from '$redlionsoft/frontend';
  import { VALIDATOR_REQUIRE_STRING } from '$redlionsoft/common';
  import FieldError from '$redlionsoft/frontend/forms/FieldError.svelte';
  export let subject: string;
  export let formContext: any;
  export let onInput: (v: string) => void;
</script>

<label for="subject"><small>Subject</small></label>
<input
  class="input"
  name="subject"
  type="text"
  bind:value={subject}
  use:formField={{ formContext, validators: [VALIDATOR_REQUIRE_STRING('Subject is required')] }}
  on:input={(e) =>
    onInput(
      // @ts-ignore
      e.target.value
    )}
/>
<FieldError name="subject" {formContext} />
