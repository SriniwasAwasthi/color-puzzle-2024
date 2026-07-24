export interface UserData {
  highScore: number;
  coins: number;
  completedLevels: number[];
}

export async function syncUserData(data: UserData): Promise<void> {
  // Always write locally first
  localStorage.setItem("puzzle2024-best", String(data.highScore));
  localStorage.setItem("puzzle2024-coins", String(data.coins));
  localStorage.setItem("puzzle2024-completed-levels", JSON.stringify(data.completedLevels));

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("user_progress").upsert({
          user_id: user.id,
          high_score: data.highScore,
          coins: data.coins,
          completed_levels: data.completedLevels,
          updated_at: new Date().toISOString()
        });
        console.log("Progress successfully synced to Supabase.");
      }
    } catch (err) {
      console.warn("Supabase sync failed, progress saved locally:", err);
    }
  }
}

export async function fetchUserData(): Promise<UserData> {
  let completedLevels: number[] = [];
  try {
    completedLevels = JSON.parse(localStorage.getItem("puzzle2024-completed-levels") ?? "[]");
    if (!Array.isArray(completedLevels)) completedLevels = [];
  } catch {
    completedLevels = [];
  }

  const localData: UserData = {
    highScore: parseInt(localStorage.getItem("puzzle2024-best") ?? "0", 10) || 0,
    coins: parseInt(localStorage.getItem("puzzle2024-coins") ?? "200", 10) || 200,
    completedLevels
  };

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("user_progress")
          .select("high_score, coins, completed_levels")
          .eq("user_id", user.id)
          .single();
        if (data && !error) {
          return {
            highScore: data.high_score,
            coins: data.coins,
            completedLevels: data.completed_levels || []
          };
        }
      }
    } catch (err) {
      console.warn("Could not fetch from Supabase, using local progress:", err);
    }
  }

  return localData;
}
