import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  DayData,
  todayKey,
  defaultDay,
  getDayDataWithLinkedValues,
  saveDayData,
  getPreviousDateKey,
  FEEDERS,
  TURBINES,
} from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import {
  syncDayToSupabase,
  fetchDayFromSupabase,
} from "@/lib/supabaseSync";

interface DayContextType {
  dateKey: string;
  setDateKey: (key: string) => void;
  day: DayData;
  setDay: React.Dispatch<React.SetStateAction<DayData>>;
  saveDay: () => Promise<void>;
  resetDay: () => void;
  loading: boolean;
  syncing: boolean;
}

const DayContext = createContext<DayContextType | undefined>(undefined);

export function DayProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dateKey, setDateKey] = useState(todayKey());
  const [day, setDay] = useState<DayData>(defaultDay(dateKey));
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadDay();
  }, [dateKey, user?.id]);

  const loadDay = async () => {
    setLoading(true);
    
    let data = await getDayDataWithLinkedValues(dateKey);
    
    if (user?.id) {
      try {
        const cloudData = await fetchDayFromSupabase(user.id, dateKey);
        if (cloudData) {
          const prevDateKey = getPreviousDateKey(dateKey);
          if (prevDateKey) {
            const prevCloudData = await fetchDayFromSupabase(user.id, prevDateKey);
            if (prevCloudData) {
              for (const f of FEEDERS) {
                const prevEnd = prevCloudData.feeders?.[f]?.end;
                if (prevEnd && !cloudData.feeders[f]?.start) {
                  cloudData.feeders[f] = {
                    ...cloudData.feeders[f],
                    start: prevEnd,
                  };
                }
              }
              for (const t of TURBINES) {
                const prevPresent = prevCloudData.turbines?.[t]?.present;
                if (prevPresent && !cloudData.turbines[t]?.previous) {
                  cloudData.turbines[t] = {
                    ...cloudData.turbines[t],
                    previous: prevPresent,
                  };
                }
              }
            }
          }
          data = cloudData;
        }
      } catch (error) {
        console.error("Error fetching from Supabase:", error);
      }
    }
    
    setDay(data);
    setLoading(false);
  };

  const saveDay = useCallback(async () => {
    const dayToSave = { ...day, dateKey };
    
    await saveDayData(dayToSave);
    
    if (user?.id) {
      setSyncing(true);
      try {
        await syncDayToSupabase(user.id, dayToSave);
      } catch (error) {
        console.error("Error syncing to Supabase:", error);
      } finally {
        setSyncing(false);
      }
    }
  }, [day, dateKey, user?.id]);

  const resetDay = useCallback(() => {
    setDay(defaultDay(dateKey));
  }, [dateKey]);

  return (
    <DayContext.Provider
      value={{
        dateKey,
        setDateKey,
        day,
        setDay,
        saveDay,
        resetDay,
        loading,
        syncing,
      }}
    >
      {children}
    </DayContext.Provider>
  );
}

export function useDay() {
  const context = useContext(DayContext);
  if (!context) {
    throw new Error("useDay must be used within a DayProvider");
  }
  return context;
}
