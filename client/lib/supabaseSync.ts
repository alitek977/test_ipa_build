import { supabase } from "./supabase";
import {
  DayData,
  FeederData,
  TurbineData,
  UserSettings,
  FEEDERS,
  TURBINES,
  defaultDay,
} from "./storage";

export async function syncDayToSupabase(
  userId: string,
  day: DayData
): Promise<boolean> {
  try {
    const { data: existingDay, error: fetchError } = await supabase
      .from("daily_data")
      .select("id")
      .eq("user_id", userId)
      .eq("date_key", day.dateKey)
      .single();

    let dailyDataId: string;

    if (fetchError && fetchError.code === "PGRST116") {
      const { data: newDay, error: insertError } = await supabase
        .from("daily_data")
        .insert({ user_id: userId, date_key: day.dateKey })
        .select("id")
        .single();

      if (insertError || !newDay) {
        console.error("Error creating daily_data:", insertError);
        return false;
      }
      dailyDataId = newDay.id;
    } else if (fetchError) {
      console.error("Error fetching daily_data:", fetchError);
      return false;
    } else {
      dailyDataId = existingDay.id;
    }

    for (const feederName of FEEDERS) {
      const feeder = day.feeders[feederName] || { start: "", end: "" };
      const { error } = await supabase
        .from("feeders")
        .upsert(
          {
            daily_data_id: dailyDataId,
            feeder_name: feederName,
            start_reading: feeder.start,
            end_reading: feeder.end,
          },
          { onConflict: "daily_data_id,feeder_name" }
        );

      if (error) {
        console.error(`Error upserting feeder ${feederName}:`, error);
      }
    }

    for (const turbineName of TURBINES) {
      const turbine = day.turbines[turbineName] || {
        previous: "",
        present: "",
        hours: "24",
      };
      const { error } = await supabase
        .from("turbines")
        .upsert(
          {
            daily_data_id: dailyDataId,
            turbine_name: turbineName,
            previous_reading: turbine.previous,
            present_reading: turbine.present,
            hours: turbine.hours,
          },
          { onConflict: "daily_data_id,turbine_name" }
        );

      if (error) {
        console.error(`Error upserting turbine ${turbineName}:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error("Error syncing day to Supabase:", error);
    return false;
  }
}

export async function fetchDayFromSupabase(
  userId: string,
  dateKey: string
): Promise<DayData | null> {
  try {
    const { data: dailyData, error: dayError } = await supabase
      .from("daily_data")
      .select("id")
      .eq("user_id", userId)
      .eq("date_key", dateKey)
      .single();

    if (dayError) {
      if (dayError.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching daily_data:", dayError);
      return null;
    }

    const { data: feedersData, error: feedersError } = await supabase
      .from("feeders")
      .select("feeder_name, start_reading, end_reading")
      .eq("daily_data_id", dailyData.id);

    if (feedersError) {
      console.error("Error fetching feeders:", feedersError);
    }

    const { data: turbinesData, error: turbinesError } = await supabase
      .from("turbines")
      .select("turbine_name, previous_reading, present_reading, hours")
      .eq("daily_data_id", dailyData.id);

    if (turbinesError) {
      console.error("Error fetching turbines:", turbinesError);
    }

    const feeders: Record<string, FeederData> = {};
    for (const f of FEEDERS) {
      const found = feedersData?.find((fd) => fd.feeder_name === f);
      feeders[f] = {
        start: found?.start_reading || "",
        end: found?.end_reading || "",
      };
    }

    const turbines: Record<string, TurbineData> = {};
    for (const t of TURBINES) {
      const found = turbinesData?.find((td) => td.turbine_name === t);
      turbines[t] = {
        previous: found?.previous_reading || "",
        present: found?.present_reading || "",
        hours: found?.hours || "24",
      };
    }

    return {
      dateKey,
      feeders,
      turbines,
    };
  } catch (error) {
    console.error("Error fetching day from Supabase:", error);
    return null;
  }
}

export async function fetchAllDaysFromSupabase(
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("daily_data")
      .select("date_key")
      .eq("user_id", userId)
      .order("date_key", { ascending: true });

    if (error) {
      console.error("Error fetching all days:", error);
      return [];
    }

    return data.map((d) => d.date_key);
  } catch (error) {
    console.error("Error fetching all days from Supabase:", error);
    return [];
  }
}

export async function fetchUserProfile(
  userId: string
): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, decimal_precision")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return {
      displayName: data.display_name || "Engineer",
      decimalPrecision: data.decimal_precision || 2,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  settings: Partial<UserSettings>
): Promise<boolean> {
  try {
    const updates: Record<string, unknown> = {};
    if (settings.displayName !== undefined) {
      updates.display_name = settings.displayName;
    }
    if (settings.decimalPrecision !== undefined) {
      updates.decimal_precision = settings.decimalPrecision;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
}

export async function syncLocalDataToSupabase(
  userId: string,
  localDays: DayData[]
): Promise<number> {
  let synced = 0;
  for (const day of localDays) {
    const success = await syncDayToSupabase(userId, day);
    if (success) synced++;
  }
  return synced;
}

export interface DaySummary {
  id: string;
  dateKey: string;
  production: number;
  exportVal: number;
  consumption: number;
}

export async function fetchMonthDaysFromSupabase(
  userId: string,
  monthKey: string
): Promise<DaySummary[]> {
  try {
    const [year, month] = monthKey.split("-").map(Number);
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonthStart = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const { data: dailyData, error } = await supabase
      .from("daily_data")
      .select("id, date_key")
      .eq("user_id", userId)
      .gte("date_key", monthStart)
      .lt("date_key", nextMonthStart)
      .order("date_key", { ascending: false });

    if (error || !dailyData) {
      console.error("Error fetching month days:", error);
      return [];
    }

    const summaries: DaySummary[] = [];

    for (const day of dailyData) {
      const { data: feedersData } = await supabase
        .from("feeders")
        .select("start_reading, end_reading")
        .eq("daily_data_id", day.id);

      const { data: turbinesData } = await supabase
        .from("turbines")
        .select("previous_reading, present_reading")
        .eq("daily_data_id", day.id);

      let production = 0;
      let exportVal = 0;

      if (turbinesData) {
        for (const t of turbinesData) {
          const prev = parseFloat(t.previous_reading) || 0;
          const pres = parseFloat(t.present_reading) || 0;
          production += (pres - prev) / 1000;
        }
      }

      if (feedersData) {
        for (const f of feedersData) {
          const start = parseFloat(f.start_reading) || 0;
          const end = parseFloat(f.end_reading) || 0;
          exportVal += (end - start) / 1000;
        }
      }

      summaries.push({
        id: day.id,
        dateKey: day.date_key,
        production,
        exportVal,
        consumption: production - exportVal,
      });
    }

    return summaries;
  } catch (error) {
    console.error("Error fetching month days:", error);
    return [];
  }
}

export async function deleteDayFromSupabase(dayId: string): Promise<boolean> {
  try {
    const { error: feedersError } = await supabase
      .from("feeders")
      .delete()
      .eq("daily_data_id", dayId);

    if (feedersError) {
      console.error("Error deleting feeders:", feedersError);
      return false;
    }

    const { error: turbinesError } = await supabase
      .from("turbines")
      .delete()
      .eq("daily_data_id", dayId);

    if (turbinesError) {
      console.error("Error deleting turbines:", turbinesError);
      return false;
    }

    const { error: dayError } = await supabase
      .from("daily_data")
      .delete()
      .eq("id", dayId);

    if (dayError) {
      console.error("Error deleting daily_data:", dayError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting day:", error);
    return false;
  }
}
