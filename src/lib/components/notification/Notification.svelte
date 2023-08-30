<script lang="ts">
    import { Transition } from "svelte-transition";
    import Container from "./Container.svelte";
    import ButtonIcon from "./ButtonIcon.svelte";
    import RadialProgress from "./RadialProgress.svelte";
    import { uploadStore } from "$lib/stores/uploadStore";
    import { downloadStore } from "$lib/stores/downloadStore";
   
  
    $: ({ fileUpload, folderUpload } = $uploadStore);
    $: ({ folderDownload, fileDownload } = $downloadStore);
  </script>
  
  <div
    aria-live="assertive"
    class="pointer-events-none
    fixed bottom-0 inset-x-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
  >
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <Transition
        show={true}
        enter="transform ease-out duration-300 transition"
        enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enterTo="translate-y-0 opacity-100 sm:translate-x-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          class="
              pointer-events-auto
              bg-gray-900
              w-full max-w-lg overflow-hidden rounded-lg shadow-lg ring-1 ring-white"
        >
          <div class="h-96 overflow-auto p-4">
            <div class="flex flex-shrink-0">
              <p class="w-0 flex-1 font-medium truncate text-white">
                Your Notifications
              </p>
  
              <ButtonIcon
                on:close={() => {
                  uploadStore.closeNotification();
                  downloadStore.closeNotification();
                }}
                text="Close"
                iconType="close"
              />
            </div>
  
            {#if Object.keys(folderUpload).length > 0}
              {#each Object.entries(folderUpload) as [name, status]}
                <Container
                  iconType="folder"
                  fileName={name}
                  currentStep={status.currentStep}
                  done={status.done === status.total}
                  handleCancel={() => {
                    uploadStore.setStatusForFolders(
                      "Upload Cancelled",
                      name,
                      status.done,
                      status.total,
                      status.controller
                    );
                    status.controller.abort();
                  }}
                >
                  <p
                    slot="progress"
                    class="text-sm font-medium truncate text-gray-400"
                  >
                    {status.done}/{status.total}
                  </p>
                </Container>
              {/each}
            {/if}
  
            {#if Object.keys(fileUpload).length > 0}
              {#each Object.entries(fileUpload) as [name, status] (name)}
                <Container
                  iconType="file"
                  fileName={name}
                  currentStep={status.currentStep}
                  done={status.progress === 100}
                  handleCancel={() => {
                    uploadStore.setStatusForFiles(
                      "Upload Cancelled",
                      name,
                      status.progress,
                      status.controller
                    );
                    status.controller.abort();
                  }}
                >
                  <p
                    slot="progress"
                    class="text-sm font-medium truncate text-gray-400"
                  >
                    <RadialProgress value={status.progress} />
                  </p>
                </Container>
              {/each}
            {/if}
  
            {#if Object.keys(folderDownload).length > 0}
              {#each Object.entries(folderDownload) as [name, status] (name)}
                <Container
                  iconType="folder"
                  fileName={name}
                  currentStep={status.currentStep}
                  done={status.progress === 100}
                  handleCancel={() => {
                    const folderToCancel = $downloadStore.folderDownload[name];
                    if (folderToCancel) {
                      folderToCancel.cancelled();
                    }
                  }}
                >
                  <p
                    slot="progress"
                    class="text-sm font-medium truncate text-gray-400"
                  >
                    {#if status.progress}
                      <RadialProgress value={status.progress} />
                    {/if}
                  </p>
                </Container>
              {/each}
            {/if}
  
            {#if Object.keys(fileDownload).length > 0}
              {#each Object.entries(fileDownload) as [name, status] (name)}
                <Container
                  iconType="file"
                  fileName={name}
                  currentStep={status.currentStep}
                  done={status.progress === 100}
                  handleCancel={() => {
                    downloadStore.setLargeFileDownload(
                      name,
                      status.progress,
                      "Download Cancelled",
                      status.cancelled
                    );
                    status.cancelled.abort();
                  }}
                >
                  <p
                    slot="progress"
                    class="text-sm font-medium truncate text-gray-400"
                  >
                    {#if status.progress}
                      <RadialProgress value={status.progress} />
                    {/if}
                  </p>
                </Container>
              {/each}
            {/if}
          </div>
        </div>
      </Transition>
    </div>
  </div>
  