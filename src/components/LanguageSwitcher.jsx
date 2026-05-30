import useLanguageStore from "@/store/useLanguageStore";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          language === "en"
            ? "bg-white text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ar")}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
          language === "ar"
            ? "bg-white text-primary shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        AR
      </button>
    </div>
  );
}
