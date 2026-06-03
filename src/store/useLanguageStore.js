import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLanguageStore = create(
  persist(
    (set) => ({
      language: "en", // "en" | "ar"
      setLanguage: (lang) => {
        set({ language: lang });
        // تغيير اتجاه الصفحة فوراً
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
      },
    }),
    { name: "keeto-language" }
  )
);

export default useLanguageStore;
