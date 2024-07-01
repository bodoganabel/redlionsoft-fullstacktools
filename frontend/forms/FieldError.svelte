<script lang="ts">
	import { derived, type Writable } from 'svelte/store';
	import type { IFormContext } from './form';

	export let name: string;
	export let formContext: IFormContext;

	const { errors } = formContext;

	const errorMessages = derived(errors, ($errors) => $errors[name] || []);
</script>

{#if $errorMessages.length}
	<div class="error-messages">
		{#each $errorMessages as error}
			<p class="text-error-500">{@html error}</p>
		{/each}
	</div>
{/if}
