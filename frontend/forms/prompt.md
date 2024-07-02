Here is [ErrorMessage.svelte]
`<script lang="ts">
import { getContext } from 'svelte';
import { CONTEXT_KEY_FORM, type IFormContext } from './formContext';

    const { formValues, touchedFields, formErrors } = getContext<IFormContext>(CONTEXT_KEY_FORM);
    export let name: string;

</script>

{#if $touchedFields[name] && $formErrors[name]}
	<div class="text-error-400 text-sm">{$formErrors[name]}</div>
{/if}
`

Here is [Form.svelte]
`<script lang="ts">
import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import type \* as yup from 'yup';
import { CONTEXT_KEY_FORM, type IFormContext } from './formContext';

    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    export let initialValues: any = {};
    export let validationSchema: yup.ObjectSchema<any>;
    export let onSubmit: (values: any) => void;
    export let onChange:
    	| ((values: typeof initialValues) => { values: typeof initialValues })
    	| undefined = undefined;

    const formValues = writable(initialValues);
    const touchedFields = writable({});
    const formErrors = writable({});

    function validateField(name: string, value: any) {
    	try {
    		validationSchema.validateSyncAt(name, { [name]: value }, { abortEarly: false });
    		return '';
    	} catch (err: any) {
    		console.error('Validation error:', err);
    		return err.errors[0];
    	}
    }

    function handleBlur(event: any) {
    	console.log('Blurred:', event.target.name);
    	const { name, value } = event.target;
    	touchedFields.update((fields) => ({ ...fields, [name]: true }));
    	formErrors.update((errors) => ({
    		...errors,
    		[name]: validateField(name, value)
    	}));
    }

    async function handleChange(event: any) {
    	console.log('Changed:', event.target.name);
    	const { name, value } = event.target;
    	formValues.update((values) => ({ ...values, [name]: value }));
    	const updatedValues = onChange ? await onChange($formValues) : $formValues;
    	if (updatedValues) {
    		formValues.set(updatedValues);
    	}
    }

    setContext<IFormContext>(CONTEXT_KEY_FORM, {
    	formValues,
    	touchedFields,
    	formErrors,
    	handleBlur,
    	handleChange
    });

    $: {
    	console.log('Form values:', $formValues);
    	console.log('Touched fields:', $touchedFields);
    	console.log('Form errors:', $formErrors);
    }

</script>

<div on:submit|preventDefault={onSubmit}>
	<slot />
</div>
`

Here is [Field.svelte]
`<script lang="ts">
import { getContext, onMount, onDestroy } from 'svelte';
import { CONTEXT_KEY_FORM, type IFormContext } from './formContext'; // Correcting the typo

    const { formValues, touchedFields, formErrors, handleBlur, handleChange } =
    	getContext<IFormContext>(CONTEXT_KEY_FORM);

    export let name: string;
    export let type = 'text';

</script>

<input value={$formValues[name] || ''} {name} {type} on:blur={handleBlur} on:input={handleChange} />
`

Here is [+page.svelte]
`<script lang="ts">
import ErrorMessage from '$lib/components/form/ErrorMessage.svelte';
	import Field from '$lib/components/form/Field.svelte';
import Form from '$lib/components/form/Form.svelte';
import \* as yup from 'yup';

    let useDifferentBusinessName = false;
    const initialValues = {
    	name: '',
    	phoneNumber: '',
    	businessName: ''
    };

    const validationSchemaBasic = yup.object().shape({
    	name: yup.string().required('Name is required'),
    	phoneNumber: yup.string().required('Phone number is required')
    });

    let validationSchema: yup.ObjectSchema<any>;

    $: {
    	validationSchema = yup.object().shape({
    		...validationSchemaBasic.fields,
    		...(false ? { businessName: yup.string().required('Business name is required') } : {})
    	});
    }

    async function handleSubmit(values: typeof initialValues) {
    	// Your custom submit logic here
    	console.log('handleSubmit called with values:', values);
    }

    function handleChange(values: any) {
    	//formValues = JSON.parse(JSON.stringify(values));
    	if (values.useDifferentBusinessName) {
    		useDifferentBusinessName = values.useDifferentBusinessName;
    	}
    	return values;
    }

</script>

<Form {initialValues} {validationSchema} onSubmit={handleSubmit} onChange={handleChange}>
	<div>
		<label for="name">Name2</label>
		<Field name="name" />
		<ErrorMessage name="name" />
	</div>

    <div>
    	<label for="phoneNumber">Phone Number</label>
    	<Field name="phoneNumber" />
    	<ErrorMessage name="phoneNumber" />
    </div>

    <div>
    	<Field name="useDifferentBusinessName" type="checkbox" />
    	<label for="useDifferentBusinessName">Use different business name</label>
    </div>

    {#if useDifferentBusinessName}
    	<div>
    		<label for="businessName">Business Name</label>
    		<Field name="businessName" />
    		<ErrorMessage name="businessName" />
    	</div>
    {/if}
    <button type="submit">Submit</button>

</Form>
`

Please combine validation, ErrorMessage and label into Field.svelte, so I can use the component like this:

`

<script>

	let isBusiness = false;
</script>

<Form onSubmit={handleSubmit} {onChange}>
<div>
	
	<Field 
	label="Name"
	name="name"
	defaultValue=""
	validation={(value) => yup.string().required('Name is required').min(2, 'Name is too short').isValid(value)}
	 />

</div>

<div>
	<Field 
	label="Address"
	name="address"
	defaultValue=""
	validation={(value) => yup.string().required('Address is required').min(2, 'Name is too short').isValid(value)}
	 />
</div>

<input type="checkbox" bind:checked={isBusiness}/>
<p> Is Business?</p>

{#if isBusiness}

<div>

    <Field
    label="Business Address"
    name="address"
    defaultValue=""
    validation={(value) => yup.string().required('Address is required').min(2, 'Name is too short').isValid(value)}
     />

</div>
{/if}

<button type="submit">Submit</button>

</Form>
`

Before implementation:
Please note that there are no more initial values passed to the form object, so create a strategy how do we handle values and validation on the form side - especially initial values and validating invisible fields (they should not be validated), and ask me 2-5 more questions about the decisions that are unclear.
