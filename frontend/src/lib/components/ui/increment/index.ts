import Root from './increment.svelte';

export type Props = {
	min: number;
	max: number;
	value: number;
};

export {
	Root,
	//
	Root as Increment
};
