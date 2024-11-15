<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;

	let events = data.events;
</script>

<div class="w-full max-w-7xl flex-grow">
	<section class="flex flex-col items-center px-4 py-10">
		<h1 class="mb-8 text-center">Gallery</h1>
		<div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each events as event}
				<a
					href={`/gallery/${event.id}`}
					class="block max-w-sm rounded-lg bg-card p-4 shadow-lg transition hover:scale-105"
				>
					<img
						class="aspect-[4/3] w-full rounded-lg object-cover"
						src={`/uploads/covers/1.jpg`}
						alt={event.name}
					/>
					<div class="flex items-center justify-between px-2 pt-3">
						<b>{event.name}</b>
						<span class="text-muted-foreground"
							>{new Date(event.date)
								.toLocaleDateString('sk-SK', {
									weekday: 'short',
									day: '2-digit',
									month: 'short',
									year: 'numeric'
								})
								.toUpperCase()}</span
						>
					</div>
				</a>
			{/each}
		</div>
	</section>
</div>
