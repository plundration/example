<script lang="ts">
	import axios, { type AxiosResponse } from 'axios';

	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Increment } from '$lib/components/ui/increment';
	import Check from 'lucide-svelte/icons/check';

	import { slide } from 'svelte/transition';
	const transition = { in: { delay: 300, duration: 300 }, out: { duration: 300 } };

	import type { TicketType } from '$lib/types';

	import type { PageData } from './$types';
	export let data: PageData;

	let event = data.event;
	$: date = new Date(event.date)
		.toLocaleDateString('sk-SK', {
			hour: '2-digit',
			minute: '2-digit',
			weekday: 'short',
			day: '2-digit',
			month: 'narrow'
		})
		.toUpperCase();

	enum Step {
		ChooseTicket,
		ChooseAmount,
		InfoForm
	}

	let step = Step.ChooseTicket;

	let chosenTicketType: TicketType | null = null;
	let chosenTicketAmount: number = 1;
	let agree = false;
	let discountPercent = 0;

	$: $formData.ticketTypeName = chosenTicketType?.name || '';
	$: $formData.ticketAmount = chosenTicketAmount;
	$: $formData.eventId = event.id;

	$: displayPrice = (chosenTicketType?.price || 0) / 100;
	$: displayTotalPrice = displayPrice * chosenTicketAmount;
	$: displayDiscountedPrice = (displayTotalPrice * (1 - discountPercent / 100)).toFixed(2);

	async function checkPromoCode() {
		discountPercent = 0;

		if (!$formData.promoCode) return;
		if (!event.id) return;

		const url = new URL(`${env.PUBLIC_API_URL}/promos/check`);
		url.search = new URLSearchParams({
			promoCode: $formData.promoCode,
			eventId: event.id.toString()
		}).toString();

		const res = await axios.get(url.toString()).catch((err) => {
			console.error(err);
			return err.response as AxiosResponse<any, any>;
		});

		if (res.status >= 400) {
			return alert(res.data.message ?? 'Promo kód nebol nájdený');
		}

		if (!res.data.discountPercent) {
			return alert(res.data.message ?? 'Promo kód nebol nájdený');
		}

		discountPercent = res.data.discountPercent;
	}

	async function startTransaction() {
		if (!chosenTicketType) {
			// TODO replace alerts
			alert('Transaction failed');
			return;
		}

		console.log($formData);

		const res = await axios.post('/api/transactions', $formData).catch((err) => {
			console.error(err);
			return err.response as AxiosResponse<any, any>;
		});

		if (res.status >= 400) {
			return alert('Transaction failed');
		}

		if (!res.data.gw_url) {
			return alert('Transaction failed');
		}

		window.location.href = res.data.gw_url;
	}

	import { type FormSchema, formSchema } from './schema';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import SuperDebug, {
		type SuperValidated,
		type Infer,
		superForm,
		defaults
	} from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { env } from '$env/dynamic/public';

	const form = superForm(defaults(zod(formSchema)), {
		SPA: true,
		validators: zod(formSchema),
		onUpdate: async ({ form }) => {
			if (form.valid) {
				await startTransaction();
			} else {
				console.log('Form is invalid');
			}
		}
	});

	export const { form: formData, enhance, submitting, errors, validateForm } = form;
</script>

<div class="w-full max-w-5xl flex-grow px-6">
	<h1 class="my-14 text-center">{event.name}</h1>

	<div class="my-12 flex flex-wrap items-center justify-center gap-10">
		<img
			class="h-auto w-full max-w-md rounded-lg object-cover {event.soldOut || !event.sellingOpen
				? 'opacity-70 grayscale-[30%]'
				: ''}"
			src={`/uploads/covers/1.jpg`}
			alt={event.name}
		/>
		<div class="flex max-w-md flex-col gap-2">
			<h3>{date}</h3>
			<p class="text-lg">{event.description}</p>
		</div>
	</div>

	<div class="my-20">
		{#if event.soldOut}
			<h2 class="text-center">Vypredané</h2>
		{:else if !event.sellingOpen}
			<h2 class="text-center">Predaj čoskoro!</h2>
		{:else if step === Step.ChooseTicket}
			<div in:slide={transition.in} out:slide={transition.out}>
				<div class="flex flex-wrap items-center justify-center gap-8 py-8">
					{#each event.ticketTypes as ticketType}
						<Card.Root class="w-full max-w-xs">
							<Card.Header>
								<Card.Title>{ticketType.name}</Card.Title>
								<h1>{ticketType.price / 100} €</h1>
							</Card.Header>
							<Card.Content>
								{#each ticketType.details as detail}
									<div class="flex items-center gap-2 py-1">
										<div
											class="flex h-5 w-5 items-center justify-center rounded-[4px] bg-primary text-primary-foreground"
										>
											<Check class="h-4 w-4" />
										</div>
										<span>{detail}</span>
									</div>
								{/each}
							</Card.Content>
							<Card.Footer>
								<Button
									on:click={() => {
										chosenTicketType = ticketType;
										step = Step.ChooseAmount;
									}}
									class="w-full">Kúpiť</Button
								>
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>
			</div>
		{:else if step === Step.ChooseAmount}
			<div
				in:slide={transition.in}
				out:slide={transition.out}
				class="flex items-center justify-center"
			>
				<Card.Root class="w-full max-w-xl">
					<div class="p-4">
						<h4>{event.name}</h4>
					</div>
					<hr />
					<div class="p-4">
						<div class="flex items-center justify-between">
							<h3>{chosenTicketType?.name} ticket</h3>
							<h3>{displayPrice} €</h3>
						</div>
						<div class="pt-1">
							<Increment min={1} max={6} bind:value={chosenTicketAmount} />
						</div>
					</div>
					<hr />
					<div class="p-4">
						<div class="flex items-center justify-between">
							<h3>Total:</h3>
							<h3>{displayTotalPrice} €</h3>
						</div>
					</div>
					<hr />
					<div class="p-4">
						<div class="flex items-center justify-between">
							<Button
								variant="secondary"
								on:click={() => {
									step = Step.ChooseTicket;
								}}>Back</Button
							>
							<Button
								on:click={() => {
									step = Step.InfoForm;
								}}>Pokračovať</Button
							>
						</div>
					</div>
				</Card.Root>
			</div>
		{:else if step === Step.InfoForm}
			<div
				in:slide={transition.in}
				out:slide={transition.out}
				class="flex items-center justify-center"
			>
				<Card.Root class="w-full max-w-xl">
					<form method="POST" action="api/transactions" use:enhance>
						<div class="p-4">
							<h4>Contact Info</h4>
						</div>

						<hr />

						<div class="p-4">
							<Form.Field {form} name="email">
								<Form.Control let:attrs>
									<Input {...attrs} placeholder="Email *" bind:value={$formData.email} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<Form.Field {form} name="confirmEmail">
								<Form.Control let:attrs>
									<Input
										{...attrs}
										placeholder="Potvrdiť email *"
										bind:value={$formData.confirmEmail}
									/>
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>

						<hr />

						<div class="p-4">
							<Form.Field {form} name="firstName">
								<Form.Control let:attrs>
									<Input {...attrs} placeholder="Meno *" bind:value={$formData.firstName} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<Form.Field {form} name="lastName">
								<Form.Control let:attrs>
									<Input {...attrs} placeholder="Priezvisko *" bind:value={$formData.lastName} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						</div>

						<hr />

						<div class="flex gap-4 p-4">
							<Form.Field {form} name="promoCode">
								<Form.Control let:attrs>
									<Input {...attrs} placeholder="Promo kód" bind:value={$formData.promoCode} />
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
							<Button on:click={checkPromoCode}>Použiť</Button>
						</div>

						<hr />

						<div class="p-4">
							<div class="flex items-center justify-between">
								<h3>Total:</h3>
								{#if discountPercent}
									<h3>
										<span class="line-through opacity-30">{displayTotalPrice}</span>
										<span class="text-red-400">-{discountPercent}%</span>
										{displayDiscountedPrice} €
									</h3>
								{:else}
									<h3>{displayTotalPrice} €</h3>
								{/if}
							</div>
							<div class="p-2">
								<div class="inline-flex items-center gap-2 p-1">
									<Checkbox bind:checked={agree} /> Súhlasím s obchodnými podmienkami *
								</div>
								<div class="inline-flex items-center gap-2 p-1">
									<Checkbox bind:checked={$formData.newsletter} /> Chcem dostávať novinky na email
								</div>
							</div>
						</div>

						<div class="flex items-center justify-between p-4">
							<Button
								on:click={() => {
									step = Step.ChooseAmount;
								}}
								variant="secondary">Back</Button
							>
							<Form.Button spinner={$submitting} disabled={!agree}>Zaplatiť</Form.Button>
						</div>
						<!-- <div class="p-4"> -->
						<!-- 	<SuperDebug data={$formData} /> -->
						<!-- </div> -->
					</form>
				</Card.Root>
			</div>
		{:else}
			<div in:slide={transition.in} out:slide={transition.out}>Error</div>
		{/if}
	</div>

	<div class="my-12 flex flex-wrap items-start justify-center gap-8">
		<div class="flex max-w-md flex-grow flex-col gap-6">
			<h3>O evente</h3>
			<p class="text-lg">{event.description}</p>
		</div>

		<div class="flex max-w-md flex-grow flex-col gap-6">
			<h3>Adresa</h3>
			<!-- <p class="text-lg">{event.address}</p> -->
			<div class="overflow-hidden rounded-lg">
				<iframe
					title="google maps adress"
					width="100%"
					frameborder="0"
					scrolling="yes"
					marginheight="0"
					marginwidth="0"
					id="gmap_canvas"
					src="https://maps.google.com/maps?q={event.address}&amp;output=embed"
				></iframe>
			</div>
		</div>
	</div>
</div>
