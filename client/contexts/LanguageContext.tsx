import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

import { translations, TranslationKey } from "@/lib/i18n";
import { 
  initializeRTL, 
  switchLanguage as rtlSwitchLanguage,
  saveLanguageOnly,
  Language,
  RTLBootstrapResult 
} from "@/lib/rtl-bootstrap";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  isHydrated: boolean;
  needsManualRestart: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function isRTLLanguage(lang: Language): boolean {
  return lang === "ar";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isHydrated, setIsHydrated] = useState(false);
  const [needsManualRestart, setNeedsManualRestart] = useState(false);

  const isRTL = isRTLLanguage(language);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const result: RTLBootstrapResult = await initializeRTL();
        
        if (!mounted) return;

        setLanguageState(result.language);
        setNeedsManualRestart(result.needsManualRestart);
        setIsHydrated(true);
      } catch (error) {
        console.error("Error initializing language:", error);
        if (mounted) {
          setLanguageState("en");
          setIsHydrated(true);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      const willReload = await rtlSwitchLanguage(lang);
      
      if (!willReload) {
        const saved = await saveLanguageOnly(lang);
        if (saved) {
          setLanguageState(lang);
        }
      }
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  if (!isHydrated) {
    return null;
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        isHydrated,
        needsManualRestart,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { Language };
