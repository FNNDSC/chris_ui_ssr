import { writable } from "svelte/store";

function setLoadingState() {
  const { subscribe, update } = writable({
    loading: false,
  });

  return {
    subscribe,
    setLoadingStatte: (loading: boolean) => {
      update((status) => {
        return {
          ...status,
          loading,
        };
      });
    },
  };
}

export const loadingStore = setLoadingState();
