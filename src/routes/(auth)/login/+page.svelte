<script lang="ts">
	import { goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Loader2 } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import type { PageData } from './$types';

	let className: string | undefined | null = undefined;
	export { className as class };

	export let data: PageData;

	let isLoading = false;

	let badRequest = {
		payload: {}
	};

	const {
		form: _form,
		errors,
		enhance
	} = superForm(data.form, {
		autoFocusOnError: 'detect',
		scrollToError: 'smooth',
		applyAction: true,
		invalidateAll: true,
		resetForm: true,
		multipleSubmits: 'prevent',
		onError({ result }) {
			badRequest.payload = result.error;
			badRequest = badRequest;
		}
	});

	$: usernameInvalid =
		$errors.username ||
		//@ts-ignore
		(badRequest.payload.username && badRequest.payload.username[0]);

	$: passwordInvalid =
		$errors.password ||
		//@ts-ignore
		(badRequest.payload.password && badRequest.payload.password[0]);

	//@ts-ignore
	$: serverError = badRequest.payload.message;
</script>

<div
	class="container relative hidden h-[800px] flex-col items-center justify-center sm:grid md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<Button
		href="/examples/authentication"
		variant="ghost"
		class="absolute right-4 top-4 md:right-8 md:top-8"
	>
		Login
	</Button>
	<div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
		<div
			class="absolute inset-0 bg-cover"
			style="
				background-image:
					url(https://user-images.githubusercontent.com/15992276/236952331-187c4c6e-08b2-4b6a-a8c2-e1c14ea1cf6d.png);"
		/>
		<div class="relative z-20 flex items-center text-lg font-medium">
			<!-- <Command class="mr-2 h-6 w-6" /> -->
			ChRIS UI
		</div>
		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-2">
				<p class="text-lg">Redesigning the UX experience on day at a time for clinical folks.</p>
				<footer class="text-sm">FNNDSC</footer>
			</blockquote>
		</div>
	</div>
	<div class="lg:p-8">
		<div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div class="flex flex-col space-y-2 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">Login to your account</h1>
				<p class="text-sm text-muted-foreground">Enter your email and password</p>
			</div>

			<div class={cn('grid gap-6', className)} {...$$restProps}>
				<form action="?/login" method="POST" use:enhance>
					<div class="grid gap-2">
						<div class="grid gap-1">
							<Label class="sr-only" for="email">Email</Label>
							<Input
								id="username"
								name="username"
								bind:value={$_form.username}
								type="text"
								autocapitalize="none"
								autocorrect="off"
								disabled={isLoading}
							/>
							{#if usernameInvalid}
								<p class="mt-2 text-sm text-red-600" id="email-error">{usernameInvalid}</p>
							{/if}
						</div>

						<div class="grid gap-1">
							<Label class="sr-only" for="email">Password</Label>
							<Input
								bind:value={$_form.password}
								id="password"
								type="password"
								name="password"
								autocorrect="off"
								disabled={isLoading}
							/>
							{#if passwordInvalid}
								<p class="mt-2 text-sm text-red-600" id="password-error">{passwordInvalid}</p>
							{/if}
						</div>

						<div>
							<button
								type="submit"
								class="
							  flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-gray-900 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
						  
							"
							>
								{#if isLoading}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								{/if}
								Sign in</button
							>
							{#if serverError}
								<p class="mt-2 text-sm text-red-600" id="server-error">{serverError}</p>
							{/if}
						</div>
					</div>
				</form>
				<p class="mt-10 text-center text-sm text-gray-400">
					Not a member?
					<Button
						on:click={() => {
							goto('/register');
						}}
						variant="link">Register here</Button
					>
				</p>
			</div>
		</div>
	</div>
</div>
