import { Form as FormPrimitive, getFormField } from 'formsnap';
import type { Writable } from 'svelte/store';

import Item from './form-item.svelte';
import Input from './form-input.svelte';

import Description from './form-description.svelte';
import Label from './form-label.svelte';
import Validation from './form-validation.svelte';
import Button from './form-button.svelte';

const Root = FormPrimitive.Root;
const Field = FormPrimitive.Field;

const NativeRadio = FormPrimitive.Radio;

export type TextareaGetFormField = Omit<ReturnType<typeof getFormField>, 'value'> & {
	value: Writable<string>;
};

export {
	Root,
	Field,
	Item,
	Input,
	Label,
	Button,
	Validation,
	Description,
	NativeRadio,
	//
	Root as Form,
	Field as FormField,
	Item as FormItem,
	Input as FormInput,
	Description as FormDescription,
	Label as FormLabel,
	Validation as FormValidation,
	NativeRadio as FormNativeRadio,
	Button as FormButton
};
