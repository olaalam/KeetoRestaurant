import useLanguageStore from "@/store/useLanguageStore";
import translations from "@/lib/translations";

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const t = (key) => translations[language]?.[key] ?? translations["en"]?.[key] ?? key;
  const isRTL = language === "ar";
  return { t, language, isRTL };
}
