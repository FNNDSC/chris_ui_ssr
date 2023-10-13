<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Form from '$lib/components/ui/form';
	import { cn } from '$lib/utils';
	import { schema } from './schema';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { RegisterSchema } from './schema';

	let className: string | undefined | null = undefined;
	export { className as class };
	export let form: SuperValidated<RegisterSchema>;
</script>

<button
	on:click={() => {
		goto('/login');
	}}
	class="absolute right-4 top-4 md:right-8 md:top-8"

>
	Login
</button>

<button
	on:click={() => {
		goto('/configure');
	}}
	class="absolute right-24 top-4 md:right-24 md:top-8"
	
>
	Configure
</button>

<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
	<div class="flex flex-col space-y-2 text-center">
		<h1 class="text-2xl font-semibold tracking-tight">Register for an account</h1>
		<p class="text-sm text-muted-foreground">Enter a username, email and password</p>
	</div>

	<div class={cn('grid gap-6', className)} {...$$restProps}>
		<Form.Root method="POST" {form} {schema} let:config>
			<Form.Field {config} name="username">
				<Form.Item>
					<Form.Label>Username</Form.Label>
					<Form.Input />
					<Form.Validation />
				</Form.Item>
			</Form.Field>
			<Form.Field {config} name="email">
				<Form.Item>
					<Form.Label>Email</Form.Label>
					<Form.Input type="email" />
					<Form.Validation />
				</Form.Item>
			</Form.Field>
			<Form.Field {config} name="password">
				<Form.Item>
					<Form.Label>Password</Form.Label>
					<Form.Input type="password" />
					<Form.Validation />
				</Form.Item>
			</Form.Field>

			<Form.Field {config} name="message">
				<Form.Item>
					<Form.Validation />
				</Form.Item>
			</Form.Field>

			<Form.Button class="mt-2">Submit</Form.Button>
		</Form.Root>
	</div>
</div>
