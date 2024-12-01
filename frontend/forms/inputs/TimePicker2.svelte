<script lang="ts">
	import Toggle from './../Toggle.svelte';

	export let onClose = (hours: number, minutes: number) => {};
	export let onChange = (hours: number, minutes: number) => {};
	export let minutesStep = 1;
	export let hours: number = new Date().getHours();
	export let minutes: number =
		(Math.round(new Date().getMinutes() / minutesStep) * minutesStep) % 60;

	let amPm: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';

	$: {
		if (minutes % minutesStep !== 0) {
			minutes -= minutes % minutesStep;
		}
	}

	$: {
		if (minutes > 60) {
			minutes = minutes - 60;
		}
		if (minutes < 0) {
			minutes = 60 + minutes;
		}
		if (hours > 24) {
			hours = hours - 24;
		}
		if (hours < 0) {
			hours = 24 + hours;
		}
	}

	function increaseHour(): void {
		hours = (hours + 1) % 24;
		onChange(hours, minutes);
	}

	function decreaseHour(): void {
		hours = (hours - 1 + 24) % 24;
		onChange(hours, minutes);
	}

	function increaseMinute(): void {
		minutes = (minutes + minutesStep) % 60;
		onChange(hours, minutes);
	}

	function decreaseMinute(): void {
		minutes = (minutes - minutesStep + 60) % 60;
		onChange(hours, minutes);
	}

	function toggleAmPm(newValue: 'AM' | 'PM'): void {
		amPm = newValue;
		hours = (hours + 12) % 24;
		onChange(hours, minutes);
	}
</script>

<div class="time-picker text-black font-semibold">
	<div class="flex space-x-3">
		<div class="space-y-1 flex flex-col justify-center items-center ">
			<button class="py-2 px-3 variant-outline-primary text-primary-500" on:click={increaseHour}
				>&#9650;</button
			>
			<p class="text-center pb-1">{hours % 12 === 0 ? 12 : hours % 12}</p>
			<button class="py-2 px-3 variant-outline-primary text-primary-500" on:click={decreaseHour}
				>&#9660;</button
			>
		</div>
		<div class="flex flex-col justify-center items-center">
			<span class="text-center pb-1">:</span>
		</div>
		<div class="space-y-1 flex flex-col justify-center items-center">
			<button class="py-2 px-3 variant-outline-primary text-primary-500" on:click={increaseMinute}
				>&#9650;</button
			>
			<p class="text-center pb-1">{minutes < 10 ? '0' + minutes : minutes}</p>
			<button class="py-2 px-3 variant-outline-primary text-primary-500" on:click={decreaseMinute}
				>&#9660;</button
			>
		</div>
		<div class="space-y-1 flex flex-col justify-center items-center">
			<Toggle
				textTrue="AM"
				textFalse="PM"
				isTrue={amPm === 'AM' ? true : false}
				onChange={(newValue) => toggleAmPm(newValue ? 'AM' : 'PM')}
			/>
		</div>
	</div>
	<button
		class="mt-4 variant-filled-primary w-full text-white font-semibold"
		on:click={() => {
			onClose(hours, minutes);
		}}>OK</button
	>
</div>

<style>
	.time-picker {
		position: fixed;
		background: white;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
		padding: 20px;
		border-radius: 4px;
		margin-top: 5px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
</style>
