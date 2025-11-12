import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations as translationsA } from "./i18n/translations";

export type Language = "ko" | "en" | "vi";

interface LanguageStore {
  currentLanguage: Language;
  renderTrigger: number;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      currentLanguage: "ko",
      renderTrigger: 0,
      setLanguage: (language: Language) => set((state) => ({ 
        currentLanguage: language,
        renderTrigger: state.renderTrigger + 1
      })),
    }),
    {
      name: "pos-language",
    },
  ),
);

export function useTranslation() {
  const { currentLanguage } = useLanguageStore();

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translationsA[currentLanguage];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  return { t, currentLanguage };
}
