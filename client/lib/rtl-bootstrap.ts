import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Alert, Platform } from "react-native";
import { reloadAppAsync } from "expo";

const LANGUAGE_KEY = "pp-app:language";
const DIRECTION_KEY = "pp-app:dir";
const RELOAD_ATTEMPT_KEY = "pp-app:reload-attempt";

export type Language = "en" | "ar";
export type Direction = "ltr" | "rtl";

export interface RTLBootstrapResult {
  language: Language;
  direction: Direction;
  isRTL: boolean;
  needsManualRestart: boolean;
}

function isRTLLanguage(lang: Language): boolean {
  return lang === "ar";
}

function getTargetDirection(lang: Language): Direction {
  return isRTLLanguage(lang) ? "rtl" : "ltr";
}

function applyI18nManagerSettings(shouldBeRTL: boolean): void {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRTL);
    I18nManager.swapLeftAndRightInRTL(true);
  } catch (e) {
    if (Platform.OS !== "web") {
      console.error("Failed to apply I18nManager settings:", e);
    }
  }
}

async function reloadApp(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  } else {
    try {
      await reloadAppAsync();
    } catch (e) {
      console.error("Failed to reload app:", e);
    }
  }
}

async function getStorageItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error(`Storage read failed for ${key}:`, e);
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`Storage write failed for ${key}:`, e);
    return false;
  }
}

async function removeStorageItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Storage remove failed for ${key}:`, e);
    return false;
  }
}

async function persistLanguageAndDirection(lang: Language, dir: Direction): Promise<boolean> {
  const langSaved = await setStorageItem(LANGUAGE_KEY, lang);
  const dirSaved = await setStorageItem(DIRECTION_KEY, dir);
  return langSaved && dirSaved;
}

export async function initializeRTL(): Promise<RTLBootstrapResult> {
  const defaultResult: RTLBootstrapResult = {
    language: "en",
    direction: "ltr",
    isRTL: false,
    needsManualRestart: false,
  };

  try {
    const savedLang = await getStorageItem(LANGUAGE_KEY);
    const savedDir = await getStorageItem(DIRECTION_KEY);
    const reloadAttempt = await getStorageItem(RELOAD_ATTEMPT_KEY);

    const language: Language = savedLang === "ar" ? "ar" : "en";
    const shouldBeRTL = isRTLLanguage(language);
    const targetDir = getTargetDirection(language);
    const currentIsRTL = I18nManager.isRTL;

    if (Platform.OS === "web") {
      applyI18nManagerSettings(shouldBeRTL);
      await persistLanguageAndDirection(language, targetDir);
      await removeStorageItem(RELOAD_ATTEMPT_KEY);
      return {
        language,
        direction: targetDir,
        isRTL: shouldBeRTL,
        needsManualRestart: false,
      };
    }

    if (currentIsRTL === shouldBeRTL) {
      await persistLanguageAndDirection(language, targetDir);
      await removeStorageItem(RELOAD_ATTEMPT_KEY);
      return {
        language,
        direction: targetDir,
        isRTL: shouldBeRTL,
        needsManualRestart: false,
      };
    }

    if (reloadAttempt === "true" && savedDir === targetDir) {
      applyI18nManagerSettings(shouldBeRTL);
      await removeStorageItem(RELOAD_ATTEMPT_KEY);
      return {
        language,
        direction: targetDir,
        isRTL: shouldBeRTL,
        needsManualRestart: true,
      };
    }

    applyI18nManagerSettings(shouldBeRTL);
    
    const persisted = await persistLanguageAndDirection(language, targetDir);
    if (!persisted) {
      return {
        language,
        direction: targetDir,
        isRTL: shouldBeRTL,
        needsManualRestart: true,
      };
    }

    await setStorageItem(RELOAD_ATTEMPT_KEY, "true");
    await reloadApp();
    
    return {
      language,
      direction: targetDir,
      isRTL: shouldBeRTL,
      needsManualRestart: false,
    };
  } catch (error) {
    console.error("Error initializing RTL:", error);
    applyI18nManagerSettings(false);
    return defaultResult;
  }
}

export async function switchLanguage(newLang: Language): Promise<boolean> {
  try {
    const currentIsRTL = I18nManager.isRTL;
    const newShouldBeRTL = isRTLLanguage(newLang);
    const needsDirectionChange = currentIsRTL !== newShouldBeRTL;

    if (!needsDirectionChange) {
      await setStorageItem(LANGUAGE_KEY, newLang);
      return false;
    }

    const targetDir = getTargetDirection(newLang);

    const persisted = await persistLanguageAndDirection(newLang, targetDir);
    if (!persisted) {
      console.error("Failed to persist language and direction");
      return false;
    }
    
    const alertMessage = newLang === "ar" 
      ? "سيتم إعادة تشغيل التطبيق لتطبيق اتجاه اللغة"
      : "App will restart to apply language direction";

    if (Platform.OS !== "web") {
      Alert.alert(
        newLang === "ar" ? "تغيير اللغة" : "Language Change",
        alertMessage,
        [{ text: newLang === "ar" ? "حسناً" : "OK" }]
      );
    }

    applyI18nManagerSettings(newShouldBeRTL);
    await setStorageItem(RELOAD_ATTEMPT_KEY, "true");

    setTimeout(async () => {
      await reloadApp();
    }, 500);

    return true;
  } catch (error) {
    console.error("Error switching language:", error);
    return false;
  }
}

export async function saveLanguageOnly(lang: Language): Promise<boolean> {
  return await setStorageItem(LANGUAGE_KEY, lang);
}

export function getCurrentDirection(): Direction {
  return I18nManager.isRTL ? "rtl" : "ltr";
}

export function isCurrentlyRTL(): boolean {
  return I18nManager.isRTL;
}
