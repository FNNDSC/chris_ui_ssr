<script lang="ts">
	import { Button } from '$components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$components/ui/dialog';
	import { Input } from '$components/ui/input';
	import { Label } from '$components/ui/label';

	export let open: boolean;
	export let value: string;
	export let handleDialogToggle: () => void;
	export let handleSave: () => void;
</script>

<Dialog closeOnEscape={false} closeOnOutsideClick={false} bind:open>
	<DialogTrigger>
		<Button on:click={handleDialogToggle} variant="secondary">Create a Folder</Button>
	</DialogTrigger>

	<DialogContent class="sm:max-w-[425px]">
		<DialogHeader>
			<DialogTitle>Create a Folder</DialogTitle>
			<DialogDescription>Give your folder a name. Click save when you're done.</DialogDescription>
		</DialogHeader>

		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label class="text-right">Name</Label>
				<Input
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							handleSave();
						}
					}}
					autocomplete="off"
					bind:value
					id="name"
					class="col-span-3"
				/>
			</div>
		</div>
		<DialogFooter>
			<Button on:click={handleSave} type="submit">Save changes</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
