<script lang="ts">
	import Gallery from '$lib/components/gallery';
	import type { PageData } from './$types';
	export let data: PageData;

	let { images, event } = data;

	$: date = new Date(event.date)
		.toLocaleDateString('sk-SK', {
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		})
		.toUpperCase();
</script>

<div class="w-full max-w-7xl flex-grow px-6">
	<section class="flex flex-col items-center py-10">
		<h1>{event.name}</h1>
		<div class="my-12 flex flex-wrap items-center justify-center gap-10">
			<img
				class="aspect-[2/1] h-auto w-full max-w-lg rounded-lg object-cover"
				src={`/uploads/covers/1.jpg`}
				alt={event.name}
			/>
			<div class="flex max-w-lg flex-col gap-2">
				<h3>{date}</h3>
				<h4>Project X</h4>
				<p class="text-lg">{event.description}</p>
			</div>
		</div>
		<Gallery gap={10} maxColumnWidth={400} hover={false} loading="lazy">
			{#each images as image}
				<!-- <img src={`/uploads/gallery/${$page.params.id}/${image}`} alt={image} /> -->
				<img class="rounded-md" src={`/uploads/gallery/1/${image}`} alt={image} />
			{/each}
		</Gallery>
	</section>
</div>
