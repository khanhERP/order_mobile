import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, TranslationKey } from './types';
import { translations } from './translations';

interface LanguageStore {
  currentLanguage: Language;
  renderTrigger: number;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      currentLanguage: 'ko',
      renderTrigger: 0,
      setLanguage: (language: Language) => set((state) => ({ 
        currentLanguage: language,
        renderTrigger: state.renderTrigger + 1
      })),
    }),
    {
      name: 'pos-language',
    }
  )
);

function getNestedTranslation(obj: any, key: string): string | undefined {
  const keys = key.split('.');
  let value = obj;

  for (const k of keys) {
    value = value?.[k];
  }

  return value;
}

export function useTranslation() {
  const currentLanguage = useLanguageStore(state => state.currentLanguage);
  const renderTrigger = useLanguageStore(state => state.renderTrigger);
  const setLanguage = useLanguageStore(state => state.setLanguage);

  const t = (key: TranslationKey): string => {
    // Force re-render by explicitly using both currentLanguage and renderTrigger
    const value = getNestedTranslation(translations[currentLanguage], key);

    // Development-time validation
    if (!value && import.meta.env.DEV) {
      console.warn(`Missing translation key: ${key} in language: ${currentLanguage}, trigger: ${renderTrigger}`);
    }

    return value || key;
  };

  return { t, currentLanguage, setLanguage };
}

// Re-export types for convenience
export type { Language, TranslationKey };