<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';
	export let size = 'w-full';
	export let stroke = 140;
</script>

<ProgressRadial
	stroke={stroke}
	meter="stroke-primary-500"
	track="stroke-primary-500/30"
	width={size}
/>
