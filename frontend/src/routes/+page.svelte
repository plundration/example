<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';

	import type { PageData } from './$types';
	export let data: PageData;

	let nextEvent = data.event || null;
	$: eventDate = nextEvent ? new Date(nextEvent.date) : null;
</script>

<div class="w-full max-w-7xl flex-grow">
	<section class="flex flex-col items-center px-6 py-10">
		<h1 class="text-center">redacted Parties</h1>
		<img
			class="my-8 aspect-[2/1] w-full max-w-2xl rounded-lg object-cover"
			src="/uploads/gallery/1/8.jpg"
			alt="video"
		/>
		<p class="text-center text-xl text-muted-foreground">
			PROVIDING EXPERIENCES <br /> THAT YOU REMEMBER
		</p>
	</section>

	{#if nextEvent && eventDate}
		<section class="px-6 py-10">
			<div class="flex flex-wrap items-center justify-center gap-4 py-4 md:gap-10">
				<img
					class="aspect-[3/2] w-full max-w-sm flex-grow rounded-lg object-cover
                    {nextEvent.soldOut || !nextEvent.sellingOpen
						? 'opacity-70 grayscale-[30%]'
						: ''}"
					src="/uploads/covers/1.jpg"
					alt="next event"
				/>
				<div class="max-w-sm flex-grow">
					<h2>{nextEvent.name}</h2>
					<div class="my-2">
						<p class="text-xl font-semibold">
							{eventDate
								.toLocaleDateString('sk-SK', {
									hour: '2-digit',
									minute: '2-digit',
									weekday: 'long',
									day: '2-digit',
									month: 'narrow'
								})
								.toUpperCase()}
						</p>
						<p>
							{nextEvent.description.substring(0, 120) +
								(nextEvent.description.length > 120 ? '...' : '')}
						</p>
					</div>

					{#if nextEvent.soldOut}
						<h4>Vypredané</h4>
					{:else if !nextEvent.sellingOpen}
						<h4>Predaj čoskoro</h4>
					{:else}
						<Button href={`/tickets`}>Buy tickets</Button>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<section class="relative px-6 py-10">
		<div class="absolute -left-full -right-full bottom-0 top-0 -z-10 h-full bg-muted" />

		<div
			class="my-10 flex flex-wrap items-center justify-center gap-4 py-4 odd:flex-row-reverse md:gap-10"
		>
			<img
				class="aspect-[3/2] w-full max-w-sm flex-grow rounded-lg object-cover"
				src="/uploads/gallery/1/5.jpg"
				alt="next event"
			/>
			<div class="max-w-sm flex-grow">
				<h2>NAŠA MISIA</h2>
				<div class="my-4">
					<p>Lorem ipsum</p>
					<p>Lorem ipsum</p>
				</div>

				<!-- TODO -->

				<Dialog.Root>
					<Dialog.Trigger>
						<Button>Read More</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Naša Misia</Dialog.Title>
							<Dialog.Description>
								Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quidem perspiciatis
								distinctio, illum eligendi neque commodi consectetur facilis! Nulla dolores iste
								eveniet inventore nostrum repellendus possimus quisquam quam! Aperiam,
								exercitationem assumenda.
							</Dialog.Description>
						</Dialog.Header>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>
		<div
			class="my-10 flex flex-wrap items-center justify-center gap-4 py-4 odd:flex-row-reverse md:gap-10"
		>
			<img
				class="aspect-[3/2] w-full max-w-sm flex-grow rounded-lg object-cover"
				src="/uploads/gallery/1/7.jpg"
				alt="next event"
			/>
			<div class="max-w-sm flex-grow">
				<h2>EVENT ARCHIVE</h2>
				<div class="my-4">
					<p>Lorem ipsum</p>
					<p>Lorem ipsum</p>
				</div>

				<!-- TODO -->
				<Button href="/gallery">Read More</Button>
			</div>
		</div>
	</section>

	<section class="flex flex-col items-center px-6 py-20">
		<!-- Light mode image -->
		<img
			class="my-8 w-full max-w-sm dark:hidden"
			src="/logo.jpg"
			alt="redacted logo in light mode"
		/>

		<!-- Dark mode image -->
		<img
			class="my-8 hidden w-full max-w-sm dark:block"
			src="/logo-dark.jpg"
			alt="redacted logo in dark mode"
		/>
	</section>

	<section class="relative flex flex-col items-center gap-8 bg-muted px-6 py-20">
		<div class="absolute -left-full -right-full bottom-0 top-0 -z-10 h-full bg-muted" />
		<h2 class="text-center">Napíšte nám pre spoluprácu</h2>
		<!-- TODO -->
		<Button>Kontakt</Button>
	</section>
</div>
