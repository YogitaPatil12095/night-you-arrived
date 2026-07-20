import { supabase, isSupabaseConfigured } from '../database/supabaseClient';

/**
 * Uploads a recorded/selected voice message and returns a playable URL.
 *
 * With Supabase configured, this uploads to the `voice-messages` storage
 * bucket and returns a real public URL that works from any device.
 * Without it, falls back to a local object URL — playable in this
 * browser tab only, useful for local development but NOT something to
 * rely on for a card that's actually going to be printed and shared.
 */
export async function uploadVoiceMessage(blob: Blob, shareCode: string): Promise<string> {
  if (!isSupabaseConfigured) {
    return URL.createObjectURL(blob);
  }

  const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('wav') ? 'wav' : 'webm';
  const path = `${shareCode}/${Date.now()}.${ext}`;

  const { error } = await supabase!.storage.from('voice-messages').upload(path, blob, {
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase!.storage.from('voice-messages').getPublicUrl(path);
  return data.publicUrl;
}

/*
 * Create the storage bucket once in the Supabase dashboard:
 *   Storage -> New bucket -> name "voice-messages" -> Public bucket: on
 *
 * Or via SQL:
 *   insert into storage.buckets (id, name, public) values ('voice-messages', 'voice-messages', true);
 */
