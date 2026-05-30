import { create } from "zustand";
import { persist } from "zustand/middleware";

const useSidebarStore = create(
  persist(
    (set) => ({
      activeModule: null,
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: "sidebar-storage",
      partialize: (state) => ({
        activeModuleKey: state.activeModule?.key || null,
      }),
      merge: (persistedState, currentState) => {
        // الـ restore بيحصل في AppSidebar/Layout بعد ما نعرف اللغة الحالية
        return {
          ...currentState,
          activeModule: persistedState?.activeModuleKey 
            ? { key: persistedState.activeModuleKey }
            : null,
        };
      },
    },
  ),
);

export default useSidebarStore;
