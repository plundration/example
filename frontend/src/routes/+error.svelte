<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex h-full flex-col items-center justify-center">
	<div class="text-9xl font-bold">{$page.status}</div>
	<div class="text-2xl">{$page.error?.message}</div>
</div>
