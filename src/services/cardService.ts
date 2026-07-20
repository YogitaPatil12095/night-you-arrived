import type { CardData } from '../types/card';
import { supabase, isSupabaseConfigured } from '../database/supabaseClient';

function randomShareCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1, easier to read off a printed card
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

/** In-memory fallback store, used only when Supabase env vars aren't set (local/dev preview). */
const memoryStore = new Map<string, CardData>();

export async function saveCard(data: CardData): Promise<{ shareCode: string }> {
  const shareCode = data.shareCode || randomShareCode();
  const record: CardData = { ...data, shareCode };

  if (isSupabaseConfigured) {
    const { error } = await supabase!.from('cards').upsert({
      share_code: shareCode,
      recipient_name: record.recipientName,
      birth_date: record.birthDate,
      birth_time: record.birthTime ?? null,
      time_is_approximate: record.timeIsApproximate,
      location_name: record.location.name,
      location_lat: record.location.lat,
      location_lon: record.location.lon,
      theme: record.theme,
      music_url: record.musicUrl ?? null,
      poem: record.poem ?? null,
      voice_message_url: record.voiceMessageUrl ?? null,
    });
    if (error) throw error;
  } else {
    memoryStore.set(shareCode, record);
  }

  return { shareCode };
}

export async function getCardByShareCode(shareCode: string): Promise<CardData | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase!.from('cards').select('*').eq('share_code', shareCode).single();
    if (error || !data) return null;
    return {
      recipientName: data.recipient_name,
      birthDate: data.birth_date,
      birthTime: data.birth_time ?? undefined,
      timeIsApproximate: data.time_is_approximate,
      location: { name: data.location_name, lat: data.location_lat, lon: data.location_lon },
      theme: data.theme,
      musicUrl: data.music_url ?? undefined,
      poem: data.poem ?? undefined,
      voiceMessageUrl: data.voice_message_url ?? undefined,
      shareCode: data.share_code,
    };
  }

  return memoryStore.get(shareCode) ?? null;
}
