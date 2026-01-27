import AsyncStorage from "@react-native-async-storage/async-storage";

export {
  formatNumber,
  format2,
  format4,
  formatWithCommas,
  formatMW,
  formatMWh,
  formatNm3,
  formatInteger,
  numberTextStyle,
} from "@/utils/numberFormat";

export const FEEDERS = ["F2", "F3", "F4", "F5"];
export const TURBINES = ["A", "B", "C", "S"];

const STORAGE_PREFIX = "pp-app:v2";

export function formatDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function storageKey(dateKey: string): string {
  return `${STORAGE_PREFIX}:day:${dateKey}`;
}

function listKey(): string {
  return `${STORAGE_PREFIX}:days:index`;
}

export interface FeederData {
  start: string;
  end: string;
}

export interface TurbineData {
  previous: string;
  present: string;
  hours: string;
}

export interface DayData {
  dateKey: string;
  feeders: Record<string, FeederData>;
  turbines: Record<string, TurbineData>;
}

export interface UserSettings {
  displayName: string;
  decimalPrecision: number;
}

const SETTINGS_KEY = "@power_plant_settings";

export function defaultDay(dateKey: string): DayData {
  return {
    dateKey,
    feeders: Object.fromEntries(
      FEEDERS.map((f) => [f, { start: "", end: "" }])
    ),
    turbines: Object.fromEntries(
      TURBINES.map((t) => [t, { previous: "", present: "", hours: "24" }])
    ),
  };
}

export function num(v: string | number | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function stripCommas(value: string): string {
  return value.replace(/,/g, "");
}

export function getPreviousDateKey(dateKey: string): string {
  const date = new Date(dateKey);
  if (isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function getDayIndex(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(listKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function upsertDayIndex(dateKey: string): Promise<void> {
  try {
    const arr = await getDayIndex();
    if (!arr.includes(dateKey)) {
      arr.push(dateKey);
      arr.sort();
      await AsyncStorage.setItem(listKey(), JSON.stringify(arr));
    }
  } catch (error) {
    console.error("Error updating day index:", error);
  }
}

export async function getDayData(dateKey: string): Promise<DayData> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(dateKey));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultDay(dateKey), ...parsed };
    }
    return defaultDay(dateKey);
  } catch {
    return defaultDay(dateKey);
  }
}

export async function getDayDataWithLinkedValues(dateKey: string): Promise<DayData> {
  const currentDay = await getDayData(dateKey);
  const prevDateKey = getPreviousDateKey(dateKey);
  
  if (!prevDateKey) return currentDay;
  
  try {
    const prevRaw = await AsyncStorage.getItem(storageKey(prevDateKey));
    if (!prevRaw) return currentDay;
    
    const prevDay = JSON.parse(prevRaw) as DayData;
    
    const linkedFeeders = { ...currentDay.feeders };
    for (const f of FEEDERS) {
      const prevEnd = prevDay.feeders?.[f]?.end;
      if (prevEnd && !currentDay.feeders[f]?.start) {
        linkedFeeders[f] = {
          ...linkedFeeders[f],
          start: prevEnd,
        };
      }
    }
    
    const linkedTurbines = { ...currentDay.turbines };
    for (const t of TURBINES) {
      const prevPresent = prevDay.turbines?.[t]?.present;
      if (prevPresent && !currentDay.turbines[t]?.previous) {
        linkedTurbines[t] = {
          ...linkedTurbines[t],
          previous: prevPresent,
        };
      }
    }
    
    return {
      ...currentDay,
      feeders: linkedFeeders,
      turbines: linkedTurbines,
    };
  } catch {
    return currentDay;
  }
}

export async function saveDayData(day: DayData): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(day.dateKey), JSON.stringify(day));
    await upsertDayIndex(day.dateKey);
  } catch (error) {
    console.error("Error saving day data:", error);
    throw error;
  }
}

export async function deleteDayData(dateKey: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(dateKey));
    const arr = await getDayIndex();
    const newArr = arr.filter((d) => d !== dateKey);
    await AsyncStorage.setItem(listKey(), JSON.stringify(newArr));
  } catch (error) {
    console.error("Error deleting day data:", error);
    throw error;
  }
}

export async function getAllDaysData(): Promise<DayData[]> {
  try {
    const index = await getDayIndex();
    const days: DayData[] = [];
    for (const dateKey of index) {
      const data = await getDayData(dateKey);
      days.push(data);
    }
    return days;
  } catch {
    return [];
  }
}

export async function getSettings(): Promise<UserSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const defaults: UserSettings = { displayName: "Engineer", decimalPrecision: 2 };
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return { displayName: "Engineer", decimalPrecision: 2 };
  }
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

export function feederExport(day: DayData): number {
  const total = FEEDERS.reduce((acc, f) => {
    const start = num(day.feeders[f]?.start);
    const end = num(day.feeders[f]?.end);
    const diff = start - end;
    return acc + diff;
  }, 0);
  return total;
}

export function turbineProductionMwh(day: DayData): number {
  return TURBINES.reduce((acc, t) => {
    const prev = num(day.turbines[t]?.previous);
    const pres = num(day.turbines[t]?.present);
    return acc + (pres - prev);
  }, 0);
}

export interface TurbineComputed {
  prev: number;
  pres: number;
  hours: number;
  diff: number;
  mwPerHr: number;
}

export function turbineRowComputed(day: DayData, t: string): TurbineComputed {
  const prev = num(day.turbines[t]?.previous);
  const pres = num(day.turbines[t]?.present);
  const hours = Math.max(0.000001, num(day.turbines[t]?.hours || "24"));
  const diff = pres - prev;
  const mwPerHr = diff / hours;
  return { prev, pres, hours, diff, mwPerHr };
}

export function gasForTurbine(diffMwh: number, mwPerHr: number): number {
  const p = diffMwh;
  const r = mwPerHr;

  if (r <= 3) return p * 1000;
  if (r <= 5) return p * 700;
  if (r <= 8) return p * 500;
  return p * 420;
}

export function m3ToMMscf(m3: number): number {
  return (m3 * 35.3146667) / 1_000_000;
}

export async function exportAllData(): Promise<string> {
  try {
    const days = await getAllDaysData();
    const settings = await getSettings();
    return JSON.stringify({ days, settings, exportedAt: new Date().toISOString() }, null, 2);
  } catch {
    return "{}";
  }
}

export async function importData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (data.days && Array.isArray(data.days)) {
      for (const day of data.days) {
        await saveDayData(day);
      }
    }
    if (data.settings) {
      await saveSettings(data.settings);
    }
    return true;
  } catch {
    return false;
  }
}
