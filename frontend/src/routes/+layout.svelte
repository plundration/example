<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { ModeWatcher, toggleMode } from 'mode-watcher';

	import Moon from 'lucide-svelte/icons/moon';
	import Sun from 'lucide-svelte/icons/sun';
	import Images from 'lucide-svelte/icons/images';
	import House from 'lucide-svelte/icons/house';
	import Ticket from 'lucide-svelte/icons/ticket';

	import '../app.css';
	import { page } from '$app/stores';
</script>

<ModeWatcher />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
		rel="stylesheet"
	/>

	<title>Redacted Parties</title>
	<meta
		name="description"
		content="Providing experiences that you remember. Najlepšie party v Bratislave a na Slovensku."
	/>
	<link rel="icon" type="image/png" href="/favicon.png" />

	<meta property="og:url" content="https://redactedparties.sk" />
	<meta property="og:title" content="redacted Parties" />
	<meta property="og:type" content="website" />
	<meta
		property="og:description"
		content="Providing experiences that you remember. Najlepšie party v Bratislave a na Slovensku."
	/>
	<meta property="og:image" content="https://redacted.sk/og.jpg" />
</svelte:head>

<div class="flex min-h-screen w-full flex-col overflow-x-hidden">
	<!-- TODO fix overflow -->
	<header class="w-full border-b border-b-border px-4 py-1">
		<nav class="relative flex items-center justify-center">
			<div class="flex gap-1">
				<a class="text-link p-2 font-bold" class:text-primary={$page.url.pathname === '/'} href="/">
					<span class="hidden sm:inline">Home</span>
					<House class="sm:hidden" />
				</a>
				<a
					class="text-link p-2 font-bold"
					class:text-primary={$page.url.pathname === '/gallery'}
					href="/gallery"
				>
					<span class="hidden sm:inline">Gallery</span>
					<Images class="sm:hidden" />
				</a>
				<a
					class="text-link p-2 font-bold"
					class:text-primary={$page.url.pathname === '/tickets'}
					href="/tickets"
				>
					<span class="hidden sm:inline">Tickets</span>
					<Ticket class="sm:hidden" />
				</a>
			</div>

			<Button on:click={toggleMode} variant="outline" size="miniIcon" class="absolute right-0">
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</nav>
	</header>

	<main class="flex flex-grow flex-col items-center justify-center">
		<slot></slot>
	</main>

	<footer
		class="flex w-full justify-between border-t border-t-border bg-card px-6 py-4 text-card-foreground"
	>
		<p class="text-center">© redacted Parties 2024</p>
		<ul class="flex gap-3">
			<li><a class="text-link" href="https://instagram.com">Instagram</a></li>
			<li><a class="text-link" href="https://twitter.com">Twitter</a></li>
		</ul>
	</footer>
</div>
