/* PLACE LayoutRoot.svelte into the root svelte file */

import { get, writable } from 'svelte/store';
import type { SvelteComponent } from 'svelte';

const modalStoreStructure: {
	isVisible: boolean;
	title: string;
	content: null | typeof SvelteComponent;
	isOutclickClose: boolean;
	params: Record<string, any>;
} = {
	isVisible: false,
	title: '',
	content: null,
	isOutclickClose: false,
	params: {}
};

// Modal visibility state and content
function createModalStore() {
	const { subscribe, set, update } = writable(modalStoreStructure);

	return {
		subscribe,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		toggleModal: (
			isVisible: boolean,
			title = '',
			content: any = null,
			params = {},
			isOutclickClose = false
		) => {
			console.log('title,content,params,isVisible:');
			console.log(title, content, params, isVisible);
			update((values) => ({ ...values, isVisible, title, content, params, isOutclickClose }));
		}
	};
}


// Use modalOpen/Modal close 
export const modalStore = createModalStore();

export const modalOpen = (title: string, content: any, params: any = {}, isOutclickClose = true) => {
	modalStore.toggleModal(true, title, content, params, isOutclickClose);

}
export const modalClose = () => {
	modalStore.toggleModal(false);
}
