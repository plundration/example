<script lang="ts">
	import type { GopayState } from '$lib/types';
	import type { PageData } from './$types';
	export let data: PageData;
	let transaction = data.transaction;
</script>

<!-- http://localhost/gopay_return/b4667e91-e185-4b35-8e58-83f048f254d5?id=12089714 -->

<div class="max-w-md py-10">
	<h2 class="py-2">Tranzakcia</h2>
	<p>ID: {transaction.id}</p>
	<p>Gopay ID: {transaction.gopayId}</p>
	<p>Stav: {transaction.state}</p>
	<p>Cena: {transaction.price / 100} €</p>
	<p>Meno: {transaction.firstName} {transaction.lastName}</p>
	<p>Email: {transaction.email}</p>
	<p>Predmet: {transaction.tickets.length} {transaction.tickets[0].ticketTypeName} tickets</p>
</div>
