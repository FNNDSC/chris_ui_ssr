import { writable } from "svelte/store";
import { shouldDeleteUpload } from "$lib/utilities/library";

interface FolderUpload {
  [key: string]: {
    currentStep: string;
    done: number;
    total: number;
    controller: AbortController;
  };
}

interface FileUpload {
  [key: string]: {
    currentStep: string;
    progress: number;
    controller: AbortController;
  };
}

export interface UploadState {
  isOpen: boolean;
  fileUpload: FileUpload;
  folderUpload: FolderUpload;
}

function getInitialStatus(): UploadState {
  return {
    isOpen: false,
    fileUpload: {},
    folderUpload: {},
  };
}

function setStatusForUploads() {
  const { subscribe, update } = writable(getInitialStatus());

  return {
    subscribe,
    setStatusForFiles: (
      currentStep: string,
      fileName: string,
      progress: number,
      controller: AbortController
    ) => {
      update((status) => {
        return {
          ...status,
          fileUpload: {
            ...status.fileUpload,
            [fileName]: {
              currentStep,
              progress,
              controller,
            },
          },
        };
      });
    },
    setStatusForFolders: (
      currentStep: string,
      name: string,
      done: number,
      total: number,
      controller: AbortController
    ) => {
      update((status) => {
        return {
          ...status,
          folderUpload: {
            [name]: {
              currentStep,
              done,
              total,
              controller,
            },
          },
        };
      });
    },
    setNewNotification: () => {
      update((status) => {
        return {
          ...status,
          isOpen: true,
        };
      });
    },

    closeNotification: () => {
      update((status) => {
        deleteCompletedFileNotifications(status.fileUpload);
        deleteCompletedFolderNotifications(status.folderUpload);
        return {
          ...status,
          isOpen: false,
        };
      });
    },
  };
}

function deleteCompletedFileNotifications(fileUpload: FileUpload) {
  for (const step in fileUpload) {
    const shouldDeleteFlag = shouldDeleteUpload(fileUpload[step].currentStep);
    shouldDeleteFlag && delete fileUpload[step];
  }
}

function deleteCompletedFolderNotifications(folderUpload: FolderUpload) {
  for (const step in folderUpload) {
    const shouldDeleteFlag = shouldDeleteUpload(folderUpload[step].currentStep);
    shouldDeleteFlag && delete folderUpload[step];
  }
}

export const uploadStore = setStatusForUploads();
