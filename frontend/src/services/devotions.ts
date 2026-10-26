import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

export type Devotion = {
  id: string;
  user_id: string;
  author_name: string;
  avatar_path?: string | null;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  reflection: string;
  created_at: string;
  devotion_date: string;
};

export type DevotionInput = {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  reflection: string;
};

type DevotionsResponse = {
  data: Devotion[];
  date: string;
};

type PublishResponse = {
  data: Devotion;
  message: string;
};

async function request(
  method: "GET" | "POST",
  input?: DevotionInput,
  signal?: AbortSignal,
) {
  if (!API_URL) {
    throw new Error("Alamat API belum dikonfigurasi.");
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  if (!data.session) {
    throw new Error("Sesi login berakhir. Silakan login kembali.");
  }

  const response = await fetch(`${API_URL}/api/devotions`, {
    method,
    signal,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(input ? { "Content-Type": "application/json" } : {}),
    },
    body: input ? JSON.stringify(input) : undefined,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : "Permintaan renungan belum berhasil.",
    );
  }

  return response.json();
}

export async function getTodayDevotions(
  signal?: AbortSignal,
): Promise<DevotionsResponse> {
  return request("GET", undefined, signal);
}

export async function publishDevotion(
  input: DevotionInput,
): Promise<PublishResponse> {
  return request("POST", input);
}

export type DevotionStreak = {
  current_streak: number;
  longest_streak: number;
  total_days: number;
  last_devotion_date: string | null;
  completed_today: boolean;
  today: string;
};

export async function getMyDevotionStreak(): Promise<DevotionStreak> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error("Silakan masuk untuk melihat streak.");
  }

  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("VITE_API_URL belum diatur.");
  }

  const response = await fetch(`${apiUrl}/api/devotions/streak`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Streak belum berhasil dimuat. Coba lagi sebentar.");
  }

  const result: { data: DevotionStreak } = await response.json();

  return result.data;
}
