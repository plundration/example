<script lang="ts">
	import { type Props } from './index.js';
	import { Button } from '$lib/components/ui/button';
	import Minus from 'lucide-svelte/icons/minus';
	import Plus from 'lucide-svelte/icons/plus';

	type $$Props = Props;

	export let min: $$Props['min'];
	export let max: $$Props['max'];
	export let value: $$Props['value'];

	value = enforceLimits(value);

	function enforceLimits(valueToEnforce: number) {
		let enforced = valueToEnforce;
		if (enforced < min) {
			enforced++;
		}
		if (enforced > max) {
			enforced--;
		}
		return enforced;
	}

	function round(valueToRound: number) {
		if (Number.isInteger(valueToRound)) {
			return valueToRound;
		}
		let rounded = Math.round(valueToRound);
		return enforceLimits(rounded);
	}

	function decrement() {
		let newValue = round(value) - 1;
		if (newValue < min) {
			return;
		}
		value = newValue;
	}

	function increment() {
		let newValue = round(value) + 1;
		if (newValue > max) {
			return;
		}
		value = newValue;
	}
</script>

<div
	class="inline-flex items-center gap-2 rounded-md border-2 border-muted-foreground bg-background p-1"
>
	<Button on:click={decrement} size="miniIcon" class="h-5 w-5">
		<Minus class="h-4 w-4" />
	</Button>

	<div class="text-md min-w-5 text-center">
		{value}
	</div>

	<Button on:click={increment} size="miniIcon" class="h-5 w-5">
		<Plus class="h-4 w-4" />
	</Button>
</div>
