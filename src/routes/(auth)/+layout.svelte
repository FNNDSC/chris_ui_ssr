<div
	class="container relative hidden h-[800px] flex-col items-center justify-center sm:grid md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	
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
		<slot />
	</div>
</div>
