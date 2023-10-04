<script lang="ts">
	export let href: string;
	export let isActive: boolean;
	export let nav: string;
	export let icon: string;
</script>

<li>
	<!-- Current: "bg-gray-800 text-white", Default: "text-gray-400 hover:text-white hover:bg-gray-800" -->
	<a
		{href}
		class="text-gray-400
        {isActive && 'text-white'}
        hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
	>
		<span
			class="
            {isActive && 'text-white'}
            flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
			>{icon}</span
		>
		<span class="truncate">{nav}</span>
	</a>
</li>
