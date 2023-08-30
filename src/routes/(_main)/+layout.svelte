<script lang="ts">
	import { createDialog, createMenu } from 'svelte-headlessui';
	import { Transition } from 'svelte-transition';
	import Notification from '$lib/components/notification/Notification.svelte';
	import { uploadStore } from '$lib/stores/uploadStore';
	import { downloadStore } from '$lib/stores/downloadStore';
	import { getActiveStatus } from '$lib/utilities/library';

	export let data;

	$: user = data.user.name;

	const dialog = createDialog({
		label: 'Close Menu Bar'
	});

	const menu = createMenu({ label: 'Actions' });

	$: currentStatus = getActiveStatus($downloadStore, $uploadStore);
</script>

<div>
	<Transition show={$dialog.expanded}>
		<div
			class="relative z-50 xl:hidden"
			role="dialog"
			aria-modal="true"
			on:click={dialog.close}
			on:keydown={(e) => {
				e.key === 'Escape' && dialog.close;
			}}
		>
			<Transition
				enter="transition-opacity ease-linear duration-300"
				enterFrom="opacity-0"
				enterTo="opacity-100"
				leave="transition-opacity ease-linear duration-300"
				leaveFrom="opacity-100"
				leaveTo="opacity-0"
			>
				<div class="fixed inset-0 bg-gray-900/80" />
			</Transition>

			<div class="fixed inset-0 flex">
				<Transition
					enter="transition ease-in-out duration-300 transform"
					enterFrom="-translate-x-full"
					enterTo="translate-x-0"
					leave="transition ease-in-out duration-300 transform"
					leaveFrom="translate-x-0"
					leaveTo="-translate-x-full"
				>
					<div class="relative mr-16 flex w-full max-w-xs flex-1">
						<Transition
							enter="ease-in-out duration-300"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="ease-in-out duration-300"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<div class="absolute left-full top-0 flex w-16 justify-center pt-5">
								<button type="button" class="-m-2.5 p-2.5" on:click={dialog.close}>
									<span class="sr-only">Close sidebar</span>
									<svg
										class="h-6 w-6 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</Transition>

						<!-- Sidebar component, swap this element with another sidebar if you like -->
						<div
							class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 ring-1 ring-white/10"
						>
							<div class="flex h-16 shrink-0 items-center">
								<h3 class="text-white">The ChRIS Dashboard</h3>
							</div>
							<nav class="flex flex-1 flex-col">
								<ul class="flex flex-1 flex-col gap-y-7">
									<li>
										<ul class="-mx-2 space-y-1">
											<li>
												<!-- Current: "bg-gray-800 text-white", Default: "text-gray-400 hover:text-white hover:bg-gray-800" -->
												<a
													href="/"
													class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
												>
													<svg
														class="h-6 w-6 shrink-0"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
														aria-hidden="true"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
														/>
													</svg>
													Dashboard
												</a>
											</li>

											<li>
												<a
													href="/analyses"
													class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
												>
													<svg
														class="h-6 w-6 shrink-0"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
														aria-hidden="true"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
														/>
													</svg>
													Existing Analyses
												</a>
											</li>
											<li>
												<a
													href="/fileuploads"
													class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
												>
													<svg
														class="h-6 w-6 shrink-0"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
														aria-hidden="true"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
														/>
													</svg>
													Create a New Analysis
												</a>
											</li>
										</ul>
									</li>
									<li>
										<div class="text-xs font-semibold leading-6 text-gray-400">Your Data</div>
										<ul class="-mx-2 mt-2 space-y-1">
											<li>
												<!-- Current: "bg-gray-800 text-white", Default: "text-gray-400 hover:text-white hover:bg-gray-800" -->
												<a
													href="/data"
													class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
												>
													<span
														class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
														>D</span
													>
													<span class="truncate">Data</span>
												</a>
											</li>
											<li>
												<a
													href="/feeds"
													class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
												>
													<span
														class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
														>F</span
													>
													<span class="truncate">Feeds</span>
												</a>
											</li>
											<li>
												<a
													href="/pacs"
													class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
												>
													<span
														class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
														>P</span
													>
													<span class="truncate">PACS</span>
												</a>
											</li>
										</ul>
									</li>
									<li class="-mx-6 mt-auto">
										<a
											href="/"
											class="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-white hover:bg-gray-800"
										>
											<img
												class="h-8 w-8 rounded-full bg-gray-800"
												src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
												alt=""
											/>
											<span class="sr-only">Your profile</span>
											<span aria-hidden="true">Tom Cook</span>
										</a>
									</li>
								</ul>
							</nav>
						</div>
					</div>
				</Transition>
			</div>
		</div>
	</Transition>

	<!-- Static sidebar for desktop -->
	<div class="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col">
		<!-- Sidebar component, swap this element with another sidebar if you like -->
		<div class="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 ring-1 ring-white/5">
			<div class="flex h-16 shrink-0 items-center">
				<h3 class="text-white">The ChRIS Dashboard</h3>
			</div>
			<nav class="flex flex-1 flex-col">
				<ul class="flex flex-1 flex-col gap-y-7">
					<li>
						<ul class="-mx-2 space-y-1">
							<li>
								<!-- Current: "bg-gray-800 text-white", Default: "text-gray-400 hover:text-white hover:bg-gray-800" -->
								<a
									href="/"
									class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
								>
									<svg
										class="h-6 w-6 shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
										/>
									</svg>
									Dashboard
								</a>
							</li>

							<li>
								<a
									href="/analyses"
									class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
								>
									<svg
										class="h-6 w-6 shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
										/>
									</svg>
									Existing Analyses
								</a>
							</li>
							<li>
								<a
									href="/createfeed"
									class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
								>
									<svg
										class="h-6 w-6 shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
										/>
									</svg>
									Create Analyses
								</a>
							</li>
						</ul>
					</li>
					<li>
						<div class="text-xs font-semibold leading-6 text-gray-400">Your Data</div>
						<ul class="-mx-2 mt-2 space-y-1">
							<li>
								<!-- Current: "bg-gray-800 text-white", Default: "text-gray-400 hover:text-white hover:bg-gray-800" -->
								<a
									href="/data"
									class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
								>
									<span
										class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
										>U</span
									>
									<span class="truncate">Data</span>
								</a>
							</li>
							<li>
								<a
									href="/feeds"
									class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
								>
									<span
										class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
										>F</span
									>
									<span class="truncate">Feeds</span>
								</a>
							</li>
							<li>
								<a
									href="/pacs"
									class="text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
								>
									<span
										class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-[0.625rem] font-medium text-gray-400 group-hover:text-white"
										>P</span
									>
									<span class="truncate">PACS</span>
								</a>
							</li>
						</ul>
					</li>
				</ul>
			</nav>
		</div>
	</div>

	<div class="xl:pl-72">
		<!-- Sticky search header -->
		<div
			class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/5 bg-gray-900 px-4 shadow-sm sm:px-6 lg:px-8"
		>
			<button type="button" class="-m-2.5 p-2.5 text-white xl:hidden" on:click={dialog.open}>
				<span class="sr-only">Open sidebar</span>
				<svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						fill-rule="evenodd"
						d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>

			<div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
				<div class="flex flex-1" />
				<div class="flex items-center gap-x-4 lg:gap-x-6">
					<button
						on:click={() => {
							uploadStore.setNewNotification();
							downloadStore.setNewNotification();
						}}
						type="button"
						class="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
					>
						<span
							class="
                inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-gray-800"
						>
							{#if currentStatus}
								<svg
									class="animate-ping h-2 w-2 fill-purple-400"
									viewBox="0 0 6 6"
									aria-hidden="true"
								>
									<circle cx="3" cy="3" r="3" />
								</svg>
							{/if}

							<svg
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
								/>
							</svg>
						</span>
					</button>

					<!-- Separator -->
					<div class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" aria-hidden="true" />

					<!-- Profile dropdown -->
					<div class="relative">
						<button
							use:menu.button
							type="button"
							class="-m-1.5 flex items-center p-1.5"
							id="user-menu-button"
							aria-expanded="false"
							aria-haspopup="true"
						>
							<span class="sr-only">Open user menu</span>
							<img
								class="h-8 w-8 rounded-full bg-gray-50"
								src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
								alt=""
							/>
							<span class="hidden lg:flex lg:items-center">
								<span class="ml-4 text-sm font-semibold leading-6 text-white" aria-hidden="true"
									>{user}</span
								>
								<svg
									class="ml-2 h-5 w-5 text-gray-400"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
						</button>

						<Transition
							show={$menu.expanded}
							enter="transition ease-out duration-100"
							enterFrom="transform opacity-0 scale-95"
							enterTo="transform opacity-100 scale-100"
							leave="transition ease-in duration-75"
							leaveFrom="transform opacity-100 scale-100"
							leaveTo="transform opacity-0 scale-95"
						>
							<div
								use:menu.items
								class="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
								role="menu"
								aria-orientation="vertical"
								aria-labelledby="user-menu-button"
								tabindex="-1"
							>
								<a
									href="/logout"
									class="block px-3 py-1 text-sm leading-6 text-gray-900"
									role="menuitem"
									tabindex="-1"
									id="user-menu-item-1">Sign out</a
								>
							</div>
						</Transition>
					</div>
				</div>
			</div>
		</div>

		<main>
			<slot />
			{#if $uploadStore.isOpen || $downloadStore.isOpen}
				<Notification />
			{/if}
		</main>
	</div>
</div>
