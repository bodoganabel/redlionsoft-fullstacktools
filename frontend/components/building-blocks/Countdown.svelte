<script lang="ts">
	import { DateTime } from 'luxon';
	import { onMount, onDestroy } from 'svelte';

	export let targetDate = DateTime.now();
	export let className = '';
	export let expiredText = "Time's Up!";
	export let textDays = 'Days';
	export let textHours = 'Hours';
	export let textMinutes = 'Minutes';
	export let textSeconds = 'Seconds';

	let days = 0;
	let hours = 0;
	let minutes = 0;
	let seconds = 0;
	let isExpired = false;
	let intervalId: any = null;

	function updateCountdown() {
		const now = DateTime.now();
		
		// Check if target date is in the past
		if (targetDate <= now) {
			days = 0;
			hours = 0;
			minutes = 0;
			seconds = 0;
			isExpired = true;
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			return;
		}

		const diff = targetDate.diff(now, ['days', 'hours', 'minutes', 'seconds']);
		
		days = Math.floor(diff.days);
		hours = Math.floor(diff.hours);
		minutes = Math.floor(diff.minutes);
		seconds = Math.floor(diff.seconds);
		isExpired = false;
	}

	onMount(() => {
		updateCountdown();
		if (!isExpired) {
			intervalId = setInterval(updateCountdown, 1000);
		}
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	function formatNumber(num: number): string {
		return num.toString().padStart(2, '0');
	}
</script>

<div class="w-full max-w-2xl mx-auto {className}">
	{#if isExpired}
		<div class="card variant-filled-error p-6 text-center">
			<h3 class="font-bold text-white/80">{expiredText}</h3>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
			<!-- Days -->
			<div class="transition-transform duration-200 hover:scale-105">
				<div class="card preset-filled-primary-500 px-1 py-2 text-center flex flex-col justify-center items-center shadow-2xl ">
					<div class="text-2xl sm:text-3xl font-bold text-white font-mono">
						{formatNumber(days)}
					</div>
					<div class="text-sm! sm:text-md! text-white/80 tracking-wide">
						{textDays}
					</div>
				</div>
			</div>

			<!-- Hours -->
			<div class="transition-transform duration-200 hover:scale-105">
				<div class="card preset-filled-primary-500 px-1 py-2 text-center flex flex-col justify-center items-center shadow-2xl ">
					<div class="text-2xl sm:text-3xl font-bold text-white font-mono">
						{formatNumber(hours)}
					</div>
					<div class="text-sm! sm:text-md! text-white/80 tracking-wide">
						{textHours}
					</div>
				</div>
			</div>

			<!-- Minutes -->
			<div class="transition-transform duration-200 hover:scale-105">
				<div class="card preset-filled-primary-500 px-1 py-2 text-center flex flex-col justify-center items-center shadow-2xl ">
					<div class="text-2xl sm:text-3xl font-bold text-white font-mono">
						{formatNumber(minutes)}
					</div>
					<div class="text-sm! sm:text-md! text-white/80 tracking-wide">
						{textMinutes}
					</div>
				</div>
			</div>

			<!-- Seconds -->
			<div class="transition-transform duration-200 hover:scale-105">
				<div class="card preset-filled-primary-500 px-1 py-2 text-center flex flex-col justify-center items-center shadow-2xl ">
					<div class="text-2xl sm:text-3xl font-bold text-white font-mono">
						{formatNumber(seconds)}
					</div>
					<div class="text-sm! sm:text-md! text-white/80 tracking-wide">
						{textSeconds}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>